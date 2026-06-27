package com.interview_platform_backend.interview_platform_backend.exportimport.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.interview_platform_backend.interview_platform_backend.candidate.entity.Interview;
import com.interview_platform_backend.interview_platform_backend.candidate.entity.InterviewFeedBack;
import com.interview_platform_backend.interview_platform_backend.candidate.repository.InterviewFeedbackRepository;
import com.interview_platform_backend.interview_platform_backend.candidate.repository.InterviewRepository;
import com.interview_platform_backend.interview_platform_backend.document.service.S3StorageService;
import com.interview_platform_backend.interview_platform_backend.exception.BadRequestException;
import com.interview_platform_backend.interview_platform_backend.exportimport.entity.ExportImportJob;
import com.interview_platform_backend.interview_platform_backend.exportimport.entity.ExportImportJob.JobFormat;
import com.interview_platform_backend.interview_platform_backend.exportimport.entity.ExportImportJob.JobStatus;
import com.interview_platform_backend.interview_platform_backend.exportimport.entity.ExportImportJob.JobType;
import com.interview_platform_backend.interview_platform_backend.exportimport.repository.ExportImportJobRepository;
import com.interview_platform_backend.interview_platform_backend.questionbank.entity.Question;
import com.interview_platform_backend.interview_platform_backend.questionbank.repository.QuestionRepository;
import com.interview_platform_backend.interview_platform_backend.user.entity.User;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import com.interview_platform_backend.interview_platform_backend.tenant.repository.OrganizationMemberRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.StringWriter;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@Service
@Transactional
public class ExportService {

    private static final Logger log = LoggerFactory.getLogger(ExportService.class);

    private final ExportImportJobRepository jobRepository;
    private final InterviewRepository interviewRepository;
    private final InterviewFeedbackRepository feedbackRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final S3StorageService s3StorageService;
    private final ObjectMapper objectMapper;

    public ExportService(ExportImportJobRepository jobRepository,
                         InterviewRepository interviewRepository,
                         InterviewFeedbackRepository feedbackRepository,
                         QuestionRepository questionRepository,
                         UserRepository userRepository,
                         OrganizationMemberRepository organizationMemberRepository,
                         S3StorageService s3StorageService) {
        this.jobRepository = jobRepository;
        this.interviewRepository = interviewRepository;
        this.feedbackRepository = feedbackRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.s3StorageService = s3StorageService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    /**
     * Resolve the organization ID for a user from their organization membership.
     * Throws BadRequestException if the user has no organization membership.
     */
    private UUID resolveOrganizationId(UUID userId) {
        return organizationMemberRepository.findByUserId(userId).stream()
                .findFirst()
                .map(member -> member.getOrganization().getId())
                .orElseThrow(() -> new BadRequestException(
                        "User " + userId + " does not belong to any organization. Cannot perform export."));
    }

    public ExportImportJob createExportJob(String entityType, JobFormat format, Map<String, String> filters, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found: " + userId));

        UUID organizationId = resolveOrganizationId(userId);

        ExportImportJob job = ExportImportJob.builder()
                .organizationId(organizationId)
                .user(user)
                .type(JobType.EXPORT)
                .format(format)
                .status(JobStatus.PENDING)
                .entityType(entityType)
                .filters(filters != null ? serializeFilters(filters) : null)
                .totalRecords(0)
                .processedRecords(0)
                .build();

        return jobRepository.save(job);
    }

    @Async
    public void exportInterviews(UUID jobId, Map<String, String> filters, JobFormat format) {
        ExportImportJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) return;

        try {
            job.setStatus(JobStatus.PROCESSING);
            job.setStartedAt(Instant.now());
            jobRepository.save(job);

            List<Interview> interviews = interviewRepository.findAllWithDetails();

            // Apply filters
            if (filters != null) {
                if (filters.containsKey("status")) {
                    String statusFilter = filters.get("status");
                    interviews = interviews.stream()
                            .filter(i -> i.getStatus().name().equalsIgnoreCase(statusFilter))
                            .collect(Collectors.toList());
                }
                if (filters.containsKey("type")) {
                    String typeFilter = filters.get("type");
                    interviews = interviews.stream()
                            .filter(i -> i.getType().name().equalsIgnoreCase(typeFilter))
                            .collect(Collectors.toList());
                }
            }

            job.setTotalRecords(interviews.size());
            jobRepository.save(job);

            byte[] content;
            String fileExtension;
            String contentType;

            if (format == JobFormat.JSON) {
                content = generateInterviewsJson(interviews);
                fileExtension = "json";
                contentType = "application/json";
            } else if (format == JobFormat.EXCEL) {
                content = generateInterviewsExcel(interviews);
                fileExtension = "xlsx";
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            } else {
                content = generateInterviewsCsv(interviews);
                fileExtension = "csv";
                contentType = "text/csv";
            }

            String fileName = "interviews_export_" + Instant.now().toEpochMilli() + "." + fileExtension;
            String s3Key = s3StorageService.generateS3Key("exports", job.getUser().getId(), fileName);

            // Upload to S3 using presigned URL approach or direct upload
            uploadBytes(content, s3Key, contentType);

            job.setFileName(fileName);
            job.setS3Key(s3Key);
            job.setProcessedRecords(interviews.size());
            job.setStatus(JobStatus.COMPLETED);
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);

            log.info("Export job {} completed. {} records exported.", jobId, interviews.size());

        } catch (Exception e) {
            log.error("Export job {} failed: {}", jobId, e.getMessage(), e);
            job.setStatus(JobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);
        }
    }

    @Async
    public void exportCandidates(UUID jobId, Map<String, String> filters, JobFormat format) {
        ExportImportJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) return;

        try {
            job.setStatus(JobStatus.PROCESSING);
            job.setStartedAt(Instant.now());
            jobRepository.save(job);

            // Export candidates (users with candidate role / who have interviews as candidates)
            List<Interview> interviews = interviewRepository.findAllWithDetails();
            Set<User> candidates = interviews.stream()
                    .map(Interview::getCandidate)
                    .collect(Collectors.toCollection(LinkedHashSet::new));

            job.setTotalRecords(candidates.size());
            jobRepository.save(job);

            byte[] content;
            String fileExtension;
            String contentType;

            if (format == JobFormat.JSON) {
                content = generateCandidatesJson(candidates);
                fileExtension = "json";
                contentType = "application/json";
            } else if (format == JobFormat.EXCEL) {
                content = generateCandidatesExcel(candidates);
                fileExtension = "xlsx";
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            } else {
                content = generateCandidatesCsv(candidates);
                fileExtension = "csv";
                contentType = "text/csv";
            }

            String fileName = "candidates_export_" + Instant.now().toEpochMilli() + "." + fileExtension;
            String s3Key = s3StorageService.generateS3Key("exports", job.getUser().getId(), fileName);

            uploadBytes(content, s3Key, contentType);

            job.setFileName(fileName);
            job.setS3Key(s3Key);
            job.setProcessedRecords(candidates.size());
            job.setStatus(JobStatus.COMPLETED);
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);

            log.info("Export job {} completed. {} candidate records exported.", jobId, candidates.size());

        } catch (Exception e) {
            log.error("Export job {} failed: {}", jobId, e.getMessage(), e);
            job.setStatus(JobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);
        }
    }

    @Async
    public void exportFeedback(UUID jobId, Map<String, String> filters, JobFormat format) {
        ExportImportJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) return;

        try {
            job.setStatus(JobStatus.PROCESSING);
            job.setStartedAt(Instant.now());
            jobRepository.save(job);

            List<InterviewFeedBack> feedbacks = feedbackRepository.findAll();

            job.setTotalRecords(feedbacks.size());
            jobRepository.save(job);

            byte[] content;
            String fileExtension;
            String contentType;

            if (format == JobFormat.JSON) {
                content = generateFeedbackJson(feedbacks);
                fileExtension = "json";
                contentType = "application/json";
            } else if (format == JobFormat.EXCEL) {
                content = generateFeedbackExcel(feedbacks);
                fileExtension = "xlsx";
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            } else {
                content = generateFeedbackCsv(feedbacks);
                fileExtension = "csv";
                contentType = "text/csv";
            }

            String fileName = "feedback_export_" + Instant.now().toEpochMilli() + "." + fileExtension;
            String s3Key = s3StorageService.generateS3Key("exports", job.getUser().getId(), fileName);

            uploadBytes(content, s3Key, contentType);

            job.setFileName(fileName);
            job.setS3Key(s3Key);
            job.setProcessedRecords(feedbacks.size());
            job.setStatus(JobStatus.COMPLETED);
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);

            log.info("Export job {} completed. {} feedback records exported.", jobId, feedbacks.size());

        } catch (Exception e) {
            log.error("Export job {} failed: {}", jobId, e.getMessage(), e);
            job.setStatus(JobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);
        }
    }

    @Async
    public void exportQuestions(UUID jobId, Map<String, String> filters, JobFormat format) {
        ExportImportJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) return;

        try {
            job.setStatus(JobStatus.PROCESSING);
            job.setStartedAt(Instant.now());
            jobRepository.save(job);

            List<Question> questions = questionRepository.findAll();

            // Apply filters
            if (filters != null) {
                if (filters.containsKey("difficulty")) {
                    String difficultyFilter = filters.get("difficulty");
                    questions = questions.stream()
                            .filter(q -> q.getDifficulty().name().equalsIgnoreCase(difficultyFilter))
                            .collect(Collectors.toList());
                }
                if (filters.containsKey("type")) {
                    String typeFilter = filters.get("type");
                    questions = questions.stream()
                            .filter(q -> q.getType().name().equalsIgnoreCase(typeFilter))
                            .collect(Collectors.toList());
                }
            }

            job.setTotalRecords(questions.size());
            jobRepository.save(job);

            byte[] content;
            String fileExtension;
            String contentType;

            if (format == JobFormat.JSON) {
                content = generateQuestionsJson(questions);
                fileExtension = "json";
                contentType = "application/json";
            } else if (format == JobFormat.EXCEL) {
                content = generateQuestionsExcel(questions);
                fileExtension = "xlsx";
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            } else {
                content = generateQuestionsCsv(questions);
                fileExtension = "csv";
                contentType = "text/csv";
            }

            String fileName = "questions_export_" + Instant.now().toEpochMilli() + "." + fileExtension;
            String s3Key = s3StorageService.generateS3Key("exports", job.getUser().getId(), fileName);

            uploadBytes(content, s3Key, contentType);

            job.setFileName(fileName);
            job.setS3Key(s3Key);
            job.setProcessedRecords(questions.size());
            job.setStatus(JobStatus.COMPLETED);
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);

            log.info("Export job {} completed. {} question records exported.", jobId, questions.size());

        } catch (Exception e) {
            log.error("Export job {} failed: {}", jobId, e.getMessage(), e);
            job.setStatus(JobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            job.setCompletedAt(Instant.now());
            jobRepository.save(job);
        }
    }

    // ==================== Excel (XLSX) Generators ====================

    private byte[] generateInterviewsExcel(List<Interview> interviews) throws IOException {
        String[] headers = {"id", "title", "status", "type", "mode", "candidateId", "candidateName",
                "scheduledById", "startTime", "endTime", "timeZone", "meetingLink", "location", "createdAt"};

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Interviews");
            CellStyle headerStyle = createHeaderStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (Interview interview : interviews) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(interview.getId() != null ? interview.getId().toString() : "");
                row.createCell(1).setCellValue(interview.getTitle() != null ? interview.getTitle() : "");
                row.createCell(2).setCellValue(interview.getStatus() != null ? interview.getStatus().name() : "");
                row.createCell(3).setCellValue(interview.getType() != null ? interview.getType().name() : "");
                row.createCell(4).setCellValue(interview.getMode() != null ? interview.getMode().name() : "");
                row.createCell(5).setCellValue(interview.getCandidate() != null ? interview.getCandidate().getId().toString() : "");
                row.createCell(6).setCellValue(interview.getCandidate() != null ?
                        interview.getCandidate().getFirstName() + " " + interview.getCandidate().getLastName() : "");
                row.createCell(7).setCellValue(interview.getScheduledBy() != null ? interview.getScheduledBy().getId().toString() : "");
                row.createCell(8).setCellValue(interview.getStartTime() != null ? interview.getStartTime().toString() : "");
                row.createCell(9).setCellValue(interview.getEndTime() != null ? interview.getEndTime().toString() : "");
                row.createCell(10).setCellValue(interview.getTimeZone() != null ? interview.getTimeZone() : "");
                row.createCell(11).setCellValue(interview.getMeetingLink() != null ? interview.getMeetingLink() : "");
                row.createCell(12).setCellValue(interview.getLocation() != null ? interview.getLocation() : "");
                row.createCell(13).setCellValue(interview.getCreatedAt() != null ? interview.getCreatedAt().toString() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private byte[] generateCandidatesExcel(Set<User> candidates) throws IOException {
        String[] headers = {"id", "firstName", "lastName", "email", "phoneNumber", "status", "createdAt"};

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Candidates");
            CellStyle headerStyle = createHeaderStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (User candidate : candidates) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(candidate.getId() != null ? candidate.getId().toString() : "");
                row.createCell(1).setCellValue(candidate.getFirstName() != null ? candidate.getFirstName() : "");
                row.createCell(2).setCellValue(candidate.getLastName() != null ? candidate.getLastName() : "");
                row.createCell(3).setCellValue(candidate.getEmail() != null ? candidate.getEmail() : "");
                row.createCell(4).setCellValue(candidate.getPhoneNumber() != null ? candidate.getPhoneNumber() : "");
                row.createCell(5).setCellValue(candidate.getStatus() != null ? candidate.getStatus().name() : "");
                row.createCell(6).setCellValue(candidate.getCreatedAt() != null ? candidate.getCreatedAt().toString() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private byte[] generateFeedbackExcel(List<InterviewFeedBack> feedbacks) throws IOException {
        String[] headers = {"id", "interviewId", "interviewerId", "rating", "recommendation",
                "strengths", "weaknesses", "comments", "submittedAt"};

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Feedback");
            CellStyle headerStyle = createHeaderStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (InterviewFeedBack feedback : feedbacks) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(feedback.getId() != null ? feedback.getId().toString() : "");
                row.createCell(1).setCellValue(feedback.getInterview() != null ? feedback.getInterview().getId().toString() : "");
                row.createCell(2).setCellValue(feedback.getInterviewer() != null ? feedback.getInterviewer().getId().toString() : "");
                row.createCell(3).setCellValue(feedback.getRating() != null ? feedback.getRating() : 0);
                row.createCell(4).setCellValue(feedback.getRecommendation() != null ? feedback.getRecommendation().name() : "");
                row.createCell(5).setCellValue(feedback.getStrengths() != null ? feedback.getStrengths() : "");
                row.createCell(6).setCellValue(feedback.getWeaknesses() != null ? feedback.getWeaknesses() : "");
                row.createCell(7).setCellValue(feedback.getComments() != null ? feedback.getComments() : "");
                row.createCell(8).setCellValue(feedback.getSubmittedAt() != null ? feedback.getSubmittedAt().toString() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private byte[] generateQuestionsExcel(List<Question> questions) throws IOException {
        String[] headers = {"id", "title", "description", "category", "difficulty", "type",
                "expectedDurationMinutes", "tags", "isActive", "createdAt"};

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Questions");
            CellStyle headerStyle = createHeaderStyle(workbook);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (Question question : questions) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(question.getId() != null ? question.getId().toString() : "");
                row.createCell(1).setCellValue(question.getTitle() != null ? question.getTitle() : "");
                row.createCell(2).setCellValue(question.getDescription() != null ? question.getDescription() : "");
                row.createCell(3).setCellValue(question.getCategory() != null ? question.getCategory().getId().toString() : "");
                row.createCell(4).setCellValue(question.getDifficulty() != null ? question.getDifficulty().name() : "");
                row.createCell(5).setCellValue(question.getType() != null ? question.getType().name() : "");
                row.createCell(6).setCellValue(question.getExpectedDurationMinutes() != null ? question.getExpectedDurationMinutes() : 0);
                row.createCell(7).setCellValue(question.getTags() != null ? question.getTags() : "");
                row.createCell(8).setCellValue(question.getIsActive() != null ? question.getIsActive().toString() : "true");
                row.createCell(9).setCellValue(question.getCreatedAt() != null ? question.getCreatedAt().toString() : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    // ==================== CSV Generators ====================

    private byte[] generateInterviewsCsv(List<Interview> interviews) throws IOException {
        String[] headers = {"id", "title", "status", "type", "mode", "candidateId", "candidateName",
                "scheduledById", "startTime", "endTime", "timeZone", "meetingLink", "location", "createdAt"};

        StringWriter writer = new StringWriter();
        CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader(headers)
                .build();

        try (CSVPrinter printer = new CSVPrinter(writer, csvFormat)) {
            for (Interview interview : interviews) {
                printer.printRecord(
                        interview.getId(),
                        interview.getTitle(),
                        interview.getStatus(),
                        interview.getType(),
                        interview.getMode(),
                        interview.getCandidate() != null ? interview.getCandidate().getId() : "",
                        interview.getCandidate() != null ?
                                interview.getCandidate().getFirstName() + " " + interview.getCandidate().getLastName() : "",
                        interview.getScheduledBy() != null ? interview.getScheduledBy().getId() : "",
                        interview.getStartTime(),
                        interview.getEndTime(),
                        interview.getTimeZone(),
                        interview.getMeetingLink() != null ? interview.getMeetingLink() : "",
                        interview.getLocation() != null ? interview.getLocation() : "",
                        interview.getCreatedAt()
                );
            }
        }
        return writer.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] generateCandidatesCsv(Set<User> candidates) throws IOException {
        String[] headers = {"id", "firstName", "lastName", "email", "phoneNumber", "status", "createdAt"};

        StringWriter writer = new StringWriter();
        CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader(headers)
                .build();

        try (CSVPrinter printer = new CSVPrinter(writer, csvFormat)) {
            for (User candidate : candidates) {
                printer.printRecord(
                        candidate.getId(),
                        candidate.getFirstName(),
                        candidate.getLastName(),
                        candidate.getEmail(),
                        candidate.getPhoneNumber() != null ? candidate.getPhoneNumber() : "",
                        candidate.getStatus() != null ? candidate.getStatus() : "",
                        candidate.getCreatedAt()
                );
            }
        }
        return writer.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] generateFeedbackCsv(List<InterviewFeedBack> feedbacks) throws IOException {
        String[] headers = {"id", "interviewId", "interviewerId", "rating", "recommendation",
                "strengths", "weaknesses", "comments", "submittedAt"};

        StringWriter writer = new StringWriter();
        CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader(headers)
                .build();

        try (CSVPrinter printer = new CSVPrinter(writer, csvFormat)) {
            for (InterviewFeedBack feedback : feedbacks) {
                printer.printRecord(
                        feedback.getId(),
                        feedback.getInterview() != null ? feedback.getInterview().getId() : "",
                        feedback.getInterviewer() != null ? feedback.getInterviewer().getId() : "",
                        feedback.getRating(),
                        feedback.getRecommendation(),
                        feedback.getStrengths() != null ? feedback.getStrengths() : "",
                        feedback.getWeaknesses() != null ? feedback.getWeaknesses() : "",
                        feedback.getComments() != null ? feedback.getComments() : "",
                        feedback.getSubmittedAt()
                );
            }
        }
        return writer.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] generateQuestionsCsv(List<Question> questions) throws IOException {
        String[] headers = {"id", "title", "description", "category", "difficulty", "type",
                "expectedDurationMinutes", "tags", "isActive", "createdAt"};

        StringWriter writer = new StringWriter();
        CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader(headers)
                .build();

        try (CSVPrinter printer = new CSVPrinter(writer, csvFormat)) {
            for (Question question : questions) {
                printer.printRecord(
                        question.getId(),
                        question.getTitle(),
                        question.getDescription() != null ? question.getDescription() : "",
                        question.getCategory() != null ? question.getCategory().getId() : "",
                        question.getDifficulty(),
                        question.getType(),
                        question.getExpectedDurationMinutes() != null ? question.getExpectedDurationMinutes() : "",
                        question.getTags() != null ? question.getTags() : "",
                        question.getIsActive(),
                        question.getCreatedAt()
                );
            }
        }
        return writer.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ==================== JSON Generators ====================

    private byte[] generateInterviewsJson(List<Interview> interviews) throws IOException {
        List<Map<String, Object>> data = interviews.stream().map(interview -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", interview.getId());
            map.put("title", interview.getTitle());
            map.put("status", interview.getStatus());
            map.put("type", interview.getType());
            map.put("mode", interview.getMode());
            map.put("candidateId", interview.getCandidate() != null ? interview.getCandidate().getId() : null);
            map.put("candidateName", interview.getCandidate() != null ?
                    interview.getCandidate().getFirstName() + " " + interview.getCandidate().getLastName() : null);
            map.put("scheduledById", interview.getScheduledBy() != null ? interview.getScheduledBy().getId() : null);
            map.put("startTime", interview.getStartTime());
            map.put("endTime", interview.getEndTime());
            map.put("timeZone", interview.getTimeZone());
            map.put("meetingLink", interview.getMeetingLink());
            map.put("location", interview.getLocation());
            map.put("createdAt", interview.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return generateJson(data);
    }

    private byte[] generateCandidatesJson(Set<User> candidates) throws IOException {
        List<Map<String, Object>> data = candidates.stream().map(candidate -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", candidate.getId());
            map.put("firstName", candidate.getFirstName());
            map.put("lastName", candidate.getLastName());
            map.put("email", candidate.getEmail());
            map.put("phoneNumber", candidate.getPhoneNumber());
            map.put("status", candidate.getStatus());
            map.put("createdAt", candidate.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return generateJson(data);
    }

    private byte[] generateFeedbackJson(List<InterviewFeedBack> feedbacks) throws IOException {
        List<Map<String, Object>> data = feedbacks.stream().map(feedback -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", feedback.getId());
            map.put("interviewId", feedback.getInterview() != null ? feedback.getInterview().getId() : null);
            map.put("interviewerId", feedback.getInterviewer() != null ? feedback.getInterviewer().getId() : null);
            map.put("rating", feedback.getRating());
            map.put("recommendation", feedback.getRecommendation());
            map.put("strengths", feedback.getStrengths());
            map.put("weaknesses", feedback.getWeaknesses());
            map.put("comments", feedback.getComments());
            map.put("submittedAt", feedback.getSubmittedAt());
            return map;
        }).collect(Collectors.toList());

        return generateJson(data);
    }

    private byte[] generateQuestionsJson(List<Question> questions) throws IOException {
        List<Map<String, Object>> data = questions.stream().map(question -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", question.getId());
            map.put("title", question.getTitle());
            map.put("description", question.getDescription());
            map.put("categoryId", question.getCategory() != null ? question.getCategory().getId() : null);
            map.put("difficulty", question.getDifficulty());
            map.put("type", question.getType());
            map.put("expectedDurationMinutes", question.getExpectedDurationMinutes());
            map.put("tags", question.getTags());
            map.put("isActive", question.getIsActive());
            map.put("createdAt", question.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return generateJson(data);
    }

    // ==================== Private Helpers ====================

    private byte[] generateJson(List<Map<String, Object>> data) throws IOException {
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(data);
    }

    private void uploadBytes(byte[] content, String s3Key, String contentType) {
        // Use S3StorageService's presigned upload or fall back to direct byte upload
        // The S3StorageService uses MultipartFile, so we use a direct approach here
        try {
            // We rely on the S3 client being accessible via presigned URL generation
            // For actual upload, we generate a presigned PUT URL and upload via HTTP,
            // or we directly call the S3 client. Since S3StorageService doesn't expose
            // a byte[] upload method, we use the presigned upload URL approach.
            // For simplicity in this implementation, we store the content and mark the key.
            // In production, this would use the S3 client directly.
            String presignedUrl = s3StorageService.generatePresignedUploadUrl(s3Key, contentType);
            // Upload using presigned URL
            java.net.http.HttpClient httpClient = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(presignedUrl))
                    .header("Content-Type", contentType)
                    .PUT(java.net.http.HttpRequest.BodyPublishers.ofByteArray(content))
                    .build();
            httpClient.send(request, java.net.http.HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload export file to S3: " + e.getMessage(), e);
        }
    }

    private String serializeFilters(Map<String, String> filters) {
        try {
            return objectMapper.writeValueAsString(filters);
        } catch (IOException e) {
            return "{}";
        }
    }

    public Map<String, String> deserializeFilters(String filtersJson) {
        if (filtersJson == null || filtersJson.isBlank()) return null;
        try {
            return objectMapper.readValue(filtersJson, Map.class);
        } catch (IOException e) {
            return null;
        }
    }
}
