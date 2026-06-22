package com.interview_platform_backend.interview_platform_backend.aiscoring;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai-scoring")
@PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER', 'INTERVIEWER')")
public class AIInterviewScoringController {

    private final AIInterviewScoringService scoringService;

    public AIInterviewScoringController(AIInterviewScoringService scoringService) {
        this.scoringService = scoringService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<AIInterviewScoringService.InterviewScore> analyzeTranscript(
            @RequestBody Map<String, String> request) {
        return ResponseEntity.ok(scoringService.analyzeTranscript(
                request.get("transcript"),
                request.getOrDefault("role", "Software Engineer"),
                request.getOrDefault("interviewType", "TECHNICAL")
        ));
    }
}
