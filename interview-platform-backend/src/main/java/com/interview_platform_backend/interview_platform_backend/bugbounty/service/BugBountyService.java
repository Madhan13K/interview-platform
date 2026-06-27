package com.interview_platform_backend.interview_platform_backend.bugbounty.service;

import com.interview_platform_backend.interview_platform_backend.bugbounty.entity.BugBountyProgram;
import com.interview_platform_backend.interview_platform_backend.bugbounty.entity.BugBountySubmission;
import com.interview_platform_backend.interview_platform_backend.bugbounty.repository.BugBountyProgramRepository;
import com.interview_platform_backend.interview_platform_backend.bugbounty.repository.BugBountySubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class BugBountyService {

    private final BugBountyProgramRepository programRepository;
    private final BugBountySubmissionRepository submissionRepository;

    @Transactional
    public BugBountyProgram createProgram(BugBountyProgram program) {
        log.info("Creating bug bounty program: {}", program.getProgramName());
        program.setCreatedAt(Instant.now());
        if (program.getStatus() == null) {
            program.setStatus(BugBountyProgram.Status.DRAFT);
        }
        return programRepository.save(program);
    }

    @Transactional
    public BugBountyProgram activateProgram(UUID programId) {
        log.info("Activating bug bounty program: {}", programId);
        BugBountyProgram program = programRepository.findById(programId)
                .orElseThrow(() -> new NoSuchElementException("Program not found: " + programId));

        program.setStatus(BugBountyProgram.Status.ACTIVE);
        program.setActivatedAt(Instant.now());
        return programRepository.save(program);
    }

    @Transactional
    public BugBountySubmission submitReport(UUID programId, BugBountySubmission submission) {
        log.info("New bug bounty submission for program {}: {}", programId, submission.getTitle());
        BugBountyProgram program = programRepository.findById(programId)
                .orElseThrow(() -> new NoSuchElementException("Program not found: " + programId));

        submission.setProgramId(programId);
        submission.setSubmittedAt(Instant.now());
        if (submission.getStatus() == null) {
            submission.setStatus(BugBountySubmission.SubmissionStatus.NEW);
        }

        BugBountySubmission saved = submissionRepository.save(submission);

        program.setTotalReports(program.getTotalReports() + 1);
        programRepository.save(program);

        return saved;
    }

    @Transactional
    public BugBountySubmission triageSubmission(UUID submissionId, BugBountySubmission.SubmissionStatus newStatus) {
        log.info("Triaging submission {}: {}", submissionId, newStatus);
        BugBountySubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NoSuchElementException("Submission not found: " + submissionId));

        submission.setStatus(newStatus);
        submission.setTriagedAt(Instant.now());
        return submissionRepository.save(submission);
    }

    @Transactional
    public BugBountySubmission resolveSubmission(UUID submissionId, double reward) {
        log.info("Resolving submission {} with reward ${}", submissionId, reward);
        BugBountySubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NoSuchElementException("Submission not found: " + submissionId));

        submission.setStatus(BugBountySubmission.SubmissionStatus.RESOLVED);
        submission.setReward(reward);
        submission.setResolvedAt(Instant.now());

        BugBountySubmission saved = submissionRepository.save(submission);

        BugBountyProgram program = programRepository.findById(submission.getProgramId())
                .orElseThrow(() -> new NoSuchElementException("Program not found: " + submission.getProgramId()));
        program.setTotalPaid(program.getTotalPaid() + reward);
        program.setValidReports(program.getValidReports() + 1);
        programRepository.save(program);

        return saved;
    }

    public double calculateReward(BugBountySubmission.Severity severity) {
        return switch (severity) {
            case CRITICAL -> 5000.0;
            case HIGH -> 2500.0;
            case MEDIUM -> 1000.0;
            case LOW -> 250.0;
            case NONE -> 0.0;
        };
    }

    public Map<String, Object> getProgramStats(UUID programId) {
        BugBountyProgram program = programRepository.findById(programId)
                .orElseThrow(() -> new NoSuchElementException("Program not found: " + programId));

        int total = submissionRepository.countByProgramId(programId);
        int valid = submissionRepository.countByProgramIdAndStatusIn(programId,
                List.of(BugBountySubmission.SubmissionStatus.ACCEPTED, BugBountySubmission.SubmissionStatus.RESOLVED));

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("programId", programId);
        stats.put("programName", program.getProgramName());
        stats.put("status", program.getStatus());
        stats.put("totalReports", total);
        stats.put("validReports", valid);
        stats.put("totalPaid", program.getTotalPaid());
        stats.put("avgResponseHours", program.getAvgResponseHours());
        stats.put("validityRate", total > 0 ? (valid * 100.0 / total) : 0.0);
        return stats;
    }

    public List<Map<String, Object>> getLeaderboard(UUID programId) {
        List<Object[]> results = submissionRepository.findLeaderboardByProgramId(programId);
        List<Map<String, Object>> leaderboard = new ArrayList<>();
        int rank = 1;
        for (Object[] row : results) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("rank", rank++);
            entry.put("reporterAlias", row[0]);
            entry.put("totalReward", row[1]);
            entry.put("submissionCount", row[2]);
            leaderboard.add(entry);
        }
        return leaderboard;
    }

    public List<BugBountyProgram> getAllPrograms() {
        return programRepository.findAll();
    }

    public Optional<BugBountyProgram> getProgram(UUID programId) {
        return programRepository.findById(programId);
    }

    public List<BugBountySubmission> getSubmissionsByProgram(UUID programId) {
        return submissionRepository.findByProgramId(programId);
    }
}
