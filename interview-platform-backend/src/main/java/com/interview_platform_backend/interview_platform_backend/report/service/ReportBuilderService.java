package com.interview_platform_backend.interview_platform_backend.report.service;

import com.interview_platform_backend.interview_platform_backend.candidate.entity.Interview;
import com.interview_platform_backend.interview_platform_backend.candidate.repository.InterviewRepository;
import com.interview_platform_backend.interview_platform_backend.document.service.S3StorageService;
import com.interview_platform_backend.interview_platform_backend.exception.BadRequestException;
import com.interview_platform_backend.interview_platform_backend.exception.ResourceNotFoundException;
import com.interview_platform_backend.interview_platform_backend.notification.EmailNotificationService;
import com.interview_platform_backend.interview_platform_backend.report.dto.*;
import com.interview_platform_backend.interview_platform_backend.report.entity.*;
import com.interview_platform_backend.interview_platform_backend.report.repository.*;
import com.interview_platform_backend.interview_platform_backend.user.entity.User;
import com.interview_platform_backend.interview_platform_backend.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class ReportBuilderService {

    private static final Logger log = LoggerFactory.getLogger(ReportBuilderService.class);

    private final ReportTemplateRepository templateRepository;
    private final ReportScheduleRepository scheduleRepository;
    private final GeneratedReportRepository generatedReportRepository;
    private final InterviewRepository interviewRepository;
    private final UserRepository userRepository;
    private final S3StorageService s3StorageService;
    private final EmailNotificationService emailService;
    private final ObjectMapper objectMapper;

    public ReportBuilderService(ReportTemplateRepository templateRepository,
                                ReportScheduleRepository scheduleRepository,
                                GeneratedReportRepository generatedReportRepository,
                                InterviewRepository interviewRepository,
                                UserRepository userRepository,
                                S3StorageService s3StorageService,
                                EmailNotificationService emailService,
                                ObjectMapper objectMapper) {
        this.templateRepository = templateRepository;
        this.scheduleRepository = scheduleRepository;
        this.generatedReportRepository = generatedReportRepository;
        this.interviewRepository = interviewRepository;
        this.userRepository = userRepository;
        this.s3StorageService = s3StorageService;
        this.emailService = emailService;
        this.objectMapper = objectMapper;
    }

    // ==================== Template CRUD ====================

    public ReportTemplateResponse createTemplate(ReportTemplateRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        ReportTemplate template = ReportTemplate.builder()
                .name(request.getName())
                .description(request.getDescription())
                .entityType(request.getEntityType())
                .columns(request.getColumns())
                .filters(request.getFilters())
                .groupBy(request.getGroupBy())
                .sortBy(request.getSortBy())
                .sortDirection(request.getSortDirection() != null ? request.getSortDirection() : "DESC")
                .aggregations(request.getAggregations())
                .chartType(request.getChartType())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .createdBy(user)
                .build();

        template = templateRepository.save(template);
        log.info("Created report template: {} (type: {})", template.getName(), template.getEntityType());
        return toResponse(template);
    }

    public ReportTemplateResponse updateTemplate(UUID templateId, ReportTemplateRequest request) {
        ReportTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("ReportTemplate", "id", templateId));

        if (request.getName() != null) template.setName(request.getName());
        if (request.getDescription() != null) template.setDescription(request.getDescription());
        if (request.getColumns() != null) template.setColumns(request.getColumns());
        if (request.getFilters() != null) template.setFilters(request.getFilters());
        if (request.getGroupBy() != null) template.setGroupBy(request.getGroupBy());
        if (request.getSortBy() != null) template.setSortBy(request.getSortBy());
        if (request.getSortDirection() != null) template.setSortDirection(request.getSortDirection());
        if (request.getAggregations() != null) template.setAggregations(request.getAggregations());
        if (request.getChartType() != null) template.setChartType(request.getChartType());
        if (request.getIsPublic() != null) template.setIsPublic(request.getIsPublic());

        template = templateRepository.save(template);
        return toResponse(template);
    }

    @Transactional(readOnly = true)
    public ReportTemplateResponse getTemplate(UUID templateId) {
        ReportTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("ReportTemplate", "id", templateId));
        return toResponse(template);
    }

    @Transactional(readOnly = true)
    public Page<ReportTemplateResponse> getTemplates(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return templateRepository.findByIsPublicTrueOrCreatedById(userId, pageable)
                .map(this::toResponse);
    }

    public void deleteTemplate(UUID templateId) {
        templateRepository.deleteById(templateId);
    }

    // ==================== Report Generation ====================

    @WithSpan("generate-report")
    @Async
    public void generateReport(UUID reportId) {
        GeneratedReport report = generatedReportRepository.findById(reportId).orElse(null);
        if (report == null) return;

        try {
            report.setStatus("GENERATING");
            report.setStartedAt(Instant.now());
            generatedReportRepository.save(report);

            ReportTemplate template = report.getTemplate();
            List<Map<String, Object>> data = queryData(template);

            byte[] fileBytes;
            String contentType;
            String extension;

            switch (report.getFormat().toUpperCase()) {
                case "EXCEL" -> {
                    fileBytes = generateExcel(data, template);
                    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    extension = "xlsx";
                }
                case "CSV" -> {
                    fileBytes = generateCsv(data, template);
                    contentType = "text/csv";
                    extension = "csv";
                }
                default -> {
                    fileBytes = generatePdf(data, template);
                    contentType = "application/pdf";
                    extension = "pdf";
                }
            }

            String s3Key = "reports/" + report.getId() + "." + extension;
            s3StorageService.uploadFile(s3Key, fileBytes, contentType);

            report.setS3Key(s3Key);
            report.setFileSizeBytes((long) fileBytes.length);
            report.setRowCount(data.size());
            report.setStatus("COMPLETED");
            report.setCompletedAt(Instant.now());

        } catch (Exception e) {
            log.error("Report generation failed for report {}: {}", reportId, e.getMessage(), e);
            report.setStatus("FAILED");
            report.setErrorMessage(e.getMessage());
            report.setCompletedAt(Instant.now());
        }

        generatedReportRepository.save(report);
    }

    public GeneratedReport createAndGenerateReport(GenerateReportRequest request, UUID userId) {
        ReportTemplate template = templateRepository.findById(request.getTemplateId())
                .orElseThrow(() -> new ResourceNotFoundException("ReportTemplate", "id", request.getTemplateId()));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String format = request.getFormat() != null ? request.getFormat().toUpperCase() : "PDF";

        GeneratedReport report = GeneratedReport.builder()
                .template(template)
                .name(template.getName() + " - " + Instant.now().toString().substring(0, 10))
                .format(format)
                .generatedBy(user)
                .status("PENDING")
                .build();

        report = generatedReportRepository.save(report);
        generateReport(report.getId());
        return report;
    }

    @Transactional(readOnly = true)
    public Page<GeneratedReport> getGeneratedReports(UUID userId, int page, int size) {
        return generatedReportRepository.findByGeneratedById(userId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    // ==================== Scheduling ====================

    public ReportSchedule createSchedule(ScheduleReportRequest request, UUID userId) {
        ReportTemplate template = templateRepository.findById(request.getTemplateId())
                .orElseThrow(() -> new ResourceNotFoundException("ReportTemplate", "id", request.getTemplateId()));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        ReportSchedule schedule = ReportSchedule.builder()
                .template(template)
                .cronExpression(request.getCronExpression())
                .format(request.getFormat() != null ? request.getFormat() : "PDF")
                .recipients(request.getRecipients().toArray(new String[0]))
                .enabled(true)
                .createdBy(user)
                .nextRunAt(Instant.now().plusSeconds(3600)) // Next hour as initial
                .build();

        return scheduleRepository.save(schedule);
    }

    @Scheduled(fixedRate = 60000) // Check every minute
    @SchedulerLock(name = "reportSchedulerLock", lockAtLeastFor = "50s")
    public void processScheduledReports() {
        List<ReportSchedule> dueSchedules = scheduleRepository
                .findByEnabledTrueAndNextRunAtBefore(Instant.now());

        for (ReportSchedule schedule : dueSchedules) {
            try {
                GenerateReportRequest req = GenerateReportRequest.builder()
                        .templateId(schedule.getTemplate().getId())
                        .format(schedule.getFormat())
                        .build();

                GeneratedReport report = createAndGenerateReport(req, schedule.getCreatedBy().getId());
                report.setSchedule(schedule);
                generatedReportRepository.save(report);

                // Send email to recipients
                for (String recipient : schedule.getRecipients()) {
                    emailService.sendEmail(recipient,
                            "Scheduled Report: " + schedule.getTemplate().getName(),
                            "Your scheduled report has been generated. Report ID: " + report.getId());
                }

                schedule.setLastRunAt(Instant.now());
                // Simple next run: add 7 days (in production, parse cron expression)
                schedule.setNextRunAt(Instant.now().plusSeconds(7 * 24 * 3600));
                scheduleRepository.save(schedule);

            } catch (Exception e) {
                log.error("Failed to process scheduled report {}: {}", schedule.getId(), e.getMessage());
            }
        }
    }

    // ==================== Data Query Engine ====================

    private List<Map<String, Object>> queryData(ReportTemplate template) {
        return switch (template.getEntityType().toUpperCase()) {
            case "INTERVIEW" -> queryInterviews(template);
            case "CANDIDATE", "USER" -> queryCandidates(template);
            default -> throw new BadRequestException("Unsupported entity type: " + template.getEntityType());
        };
    }

    private List<Map<String, Object>> queryInterviews(ReportTemplate template) {
        List<Interview> interviews = interviewRepository.findAll();
        List<Map<String, Object>> results = new ArrayList<>();

        for (Interview i : interviews) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", i.getId());
            row.put("title", i.getTitle());
            row.put("status", i.getStatus() != null ? i.getStatus().name() : "");
            row.put("type", i.getType() != null ? i.getType().name() : "");
            row.put("mode", i.getMode() != null ? i.getMode().name() : "");
            row.put("candidateEmail", i.getCandidate() != null ? i.getCandidate().getEmail() : "");
            row.put("candidateName", i.getCandidate() != null ?
                    (i.getCandidate().getFirstName() + " " + i.getCandidate().getLastName()) : "");
            row.put("scheduledBy", i.getScheduledBy() != null ? i.getScheduledBy().getEmail() : "");
            row.put("startTime", i.getStartTime() != null ? i.getStartTime().toString() : "");
            row.put("endTime", i.getEndTime() != null ? i.getEndTime().toString() : "");
            row.put("createdAt", i.getCreatedAt() != null ? i.getCreatedAt().toString() : "");
            results.add(row);
        }
        return results;
    }

    private List<Map<String, Object>> queryCandidates(ReportTemplate template) {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> results = new ArrayList<>();

        for (User u : users) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", u.getId());
            row.put("email", u.getEmail());
            row.put("firstName", u.getFirstName());
            row.put("lastName", u.getLastName());
            row.put("status", u.getStatus() != null ? u.getStatus().name() : "");
            row.put("authProvider", u.getAuthProvider() != null ? u.getAuthProvider().name() : "");
            row.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
            results.add(row);
        }
        return results;
    }

    // ==================== Export Generators ====================

    private byte[] generatePdf(List<Map<String, Object>> data, ReportTemplate template) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        com.lowagie.text.Document document = new com.lowagie.text.Document(PageSize.A4.rotate());
        PdfWriter.getInstance(document, baos);
        document.open();

        // Title
        Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD);
        document.add(new Paragraph(template.getName(), titleFont));
        document.add(new Paragraph("Generated: " + Instant.now().toString().substring(0, 19)));
        document.add(new Paragraph("Total rows: " + data.size()));
        document.add(new Paragraph(" "));

        if (!data.isEmpty()) {
            Set<String> columns = data.get(0).keySet();
            PdfPTable table = new PdfPTable(columns.size());
            table.setWidthPercentage(100);

            // Headers
            Font headerFont = new Font(Font.HELVETICA, 8, Font.BOLD);
            for (String col : columns) {
                PdfPCell cell = new PdfPCell(new Phrase(col, headerFont));
                cell.setBackgroundColor(new java.awt.Color(220, 220, 220));
                table.addCell(cell);
            }

            // Rows
            Font cellFont = new Font(Font.HELVETICA, 7);
            for (Map<String, Object> row : data) {
                for (String col : columns) {
                    Object val = row.get(col);
                    table.addCell(new Phrase(val != null ? val.toString() : "", cellFont));
                }
            }

            document.add(table);
        }

        document.close();
        return baos.toByteArray();
    }

    private byte[] generateExcel(List<Map<String, Object>> data, ReportTemplate template) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(template.getName());

            if (!data.isEmpty()) {
                // Header row
                Row headerRow = sheet.createRow(0);
                List<String> columns = new ArrayList<>(data.get(0).keySet());
                for (int i = 0; i < columns.size(); i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(columns.get(i));
                    CellStyle style = workbook.createCellStyle();
                    org.apache.poi.ss.usermodel.Font font = workbook.createFont();
                    font.setBold(true);
                    style.setFont(font);
                    cell.setCellStyle(style);
                }

                // Data rows
                for (int rowIdx = 0; rowIdx < data.size(); rowIdx++) {
                    Row row = sheet.createRow(rowIdx + 1);
                    Map<String, Object> rowData = data.get(rowIdx);
                    for (int colIdx = 0; colIdx < columns.size(); colIdx++) {
                        Cell cell = row.createCell(colIdx);
                        Object val = rowData.get(columns.get(colIdx));
                        cell.setCellValue(val != null ? val.toString() : "");
                    }
                }

                // Auto-size columns
                for (int i = 0; i < columns.size(); i++) {
                    sheet.autoSizeColumn(i);
                }
            }

            workbook.write(baos);
        }
        return baos.toByteArray();
    }

    private byte[] generateCsv(List<Map<String, Object>> data, ReportTemplate template) {
        StringBuilder sb = new StringBuilder();

        if (!data.isEmpty()) {
            List<String> columns = new ArrayList<>(data.get(0).keySet());
            sb.append(String.join(",", columns)).append("\n");

            for (Map<String, Object> row : data) {
                List<String> values = columns.stream()
                        .map(col -> {
                            Object val = row.get(col);
                            String str = val != null ? val.toString() : "";
                            if (str.contains(",") || str.contains("\"") || str.contains("\n")) {
                                return "\"" + str.replace("\"", "\"\"") + "\"";
                            }
                            return str;
                        })
                        .toList();
                sb.append(String.join(",", values)).append("\n");
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ==================== Mapping ====================

    private ReportTemplateResponse toResponse(ReportTemplate template) {
        return ReportTemplateResponse.builder()
                .id(template.getId())
                .name(template.getName())
                .description(template.getDescription())
                .entityType(template.getEntityType())
                .columns(template.getColumns())
                .filters(template.getFilters())
                .groupBy(template.getGroupBy())
                .sortBy(template.getSortBy())
                .sortDirection(template.getSortDirection())
                .aggregations(template.getAggregations())
                .chartType(template.getChartType())
                .isPublic(template.getIsPublic())
                .createdByEmail(template.getCreatedBy() != null ? template.getCreatedBy().getEmail() : null)
                .organizationId(template.getOrganizationId())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }
}
