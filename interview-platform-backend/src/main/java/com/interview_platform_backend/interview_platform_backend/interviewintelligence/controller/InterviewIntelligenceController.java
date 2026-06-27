package com.interview_platform_backend.interview_platform_backend.interviewintelligence.controller;

import com.interview_platform_backend.interview_platform_backend.interviewintelligence.entity.InterviewInsight;
import com.interview_platform_backend.interview_platform_backend.interviewintelligence.service.InterviewIntelligenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/interview-intelligence")
@RequiredArgsConstructor
public class InterviewIntelligenceController {

    private final InterviewIntelligenceService intelligenceService;

    @PostMapping("/generate/{orgId}")
    public ResponseEntity<List<InterviewInsight>> generateInsights(
            @PathVariable UUID orgId,
            @RequestParam Instant since) {
        List<InterviewInsight> insights = intelligenceService.generateInsights(orgId, since);
        return ResponseEntity.ok(insights);
    }

    @GetMapping("/failure-points/{orgId}")
    public ResponseEntity<List<InterviewInsight>> getFailurePoints(@PathVariable UUID orgId) {
        return ResponseEntity.ok(intelligenceService.getFailurePoints(orgId));
    }

    @GetMapping("/best-questions/{orgId}")
    public ResponseEntity<List<InterviewInsight>> getBestQuestions(@PathVariable UUID orgId) {
        return ResponseEntity.ok(intelligenceService.getBestQuestions(orgId));
    }

    @GetMapping("/time-correlations/{orgId}")
    public ResponseEntity<List<InterviewInsight>> getTimeToAnswerCorrelations(@PathVariable UUID orgId) {
        return ResponseEntity.ok(intelligenceService.getTimeToAnswerCorrelations(orgId));
    }

    @GetMapping("/drop-off/{orgId}")
    public ResponseEntity<List<InterviewInsight>> getDropOffAnalysis(@PathVariable UUID orgId) {
        return ResponseEntity.ok(intelligenceService.getDropOffAnalysis(orgId));
    }
}
