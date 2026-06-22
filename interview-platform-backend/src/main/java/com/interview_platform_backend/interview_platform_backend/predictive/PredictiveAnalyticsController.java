package com.interview_platform_backend.interview_platform_backend.predictive;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/predictions")
@PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
public class PredictiveAnalyticsController {

    private final PredictiveAnalyticsService predictiveService;

    public PredictiveAnalyticsController(PredictiveAnalyticsService predictiveService) {
        this.predictiveService = predictiveService;
    }

    @GetMapping("/candidate/{candidateId}/success")
    public ResponseEntity<PredictiveAnalyticsService.CandidateSuccessPrediction> predictSuccess(
            @PathVariable UUID candidateId) {
        return ResponseEntity.ok(predictiveService.predictCandidateSuccess(candidateId));
    }

    @GetMapping("/interviewer/{interviewerId}/bias")
    public ResponseEntity<PredictiveAnalyticsService.InterviewerBiasReport> detectBias(
            @PathVariable UUID interviewerId) {
        return ResponseEntity.ok(predictiveService.detectInterviewerBias(interviewerId));
    }

    @GetMapping("/time-to-hire")
    public ResponseEntity<Map<String, Object>> predictTimeToHire(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String level) {
        return ResponseEntity.ok(predictiveService.predictTimeToHire(department, level));
    }
}
