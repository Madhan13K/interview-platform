package com.interview_platform_backend.interview_platform_backend.engagementscoring.controller;

import com.interview_platform_backend.interview_platform_backend.engagementscoring.entity.EngagementScore;
import com.interview_platform_backend.interview_platform_backend.engagementscoring.service.EngagementScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/engagement-scores")
@RequiredArgsConstructor
public class EngagementScoringController {

    private final EngagementScoringService engagementScoringService;

    @PostMapping("/calculate/{candidateId}")
    public ResponseEntity<EngagementScore> calculateScore(@PathVariable UUID candidateId) {
        EngagementScore score = engagementScoringService.calculateScore(candidateId);
        return ResponseEntity.ok(score);
    }

    @PostMapping("/activity/{candidateId}")
    public ResponseEntity<EngagementScore> updateOnActivity(
            @PathVariable UUID candidateId,
            @RequestBody Map<String, String> request) {
        EngagementScore score = engagementScoringService.updateOnActivity(
                candidateId, request.get("activityType"));
        return ResponseEntity.ok(score);
    }

    @GetMapping("/{candidateId}")
    public ResponseEntity<EngagementScore> getScore(@PathVariable UUID candidateId) {
        EngagementScore score = engagementScoringService.getScore(candidateId);
        if (score == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(score);
    }

    @GetMapping("/top")
    public ResponseEntity<List<EngagementScore>> getTopEngaged(
            @RequestParam(defaultValue = "10") int limit) {
        List<EngagementScore> topScores = engagementScoringService.getTopEngaged(limit);
        return ResponseEntity.ok(topScores);
    }
}
