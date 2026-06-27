package com.interview_platform_backend.interview_platform_backend.aisummarizer.controller;

import com.interview_platform_backend.interview_platform_backend.aisummarizer.entity.InterviewSummaryV2;
import com.interview_platform_backend.interview_platform_backend.aisummarizer.service.AISummarizerV2Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/interview-summaries")
@RequiredArgsConstructor
public class AISummarizerController {

    private final AISummarizerV2Service summarizerService;

    @PostMapping("/generate/{interviewId}")
    public ResponseEntity<InterviewSummaryV2> generateSummary(@PathVariable UUID interviewId) {
        InterviewSummaryV2 summary = summarizerService.generateSummary(interviewId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{interviewId}")
    public ResponseEntity<InterviewSummaryV2> getSummary(@PathVariable UUID interviewId) {
        InterviewSummaryV2 summary = summarizerService.getSummary(interviewId);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/{id}/distribute")
    public ResponseEntity<InterviewSummaryV2> distributeSummary(@PathVariable UUID id) {
        InterviewSummaryV2 summary = summarizerService.distributeSummary(id);
        return ResponseEntity.ok(summary);
    }
}
