package com.interview_platform_backend.interview_platform_backend.interviewcoaching.controller;

import com.interview_platform_backend.interview_platform_backend.interviewcoaching.entity.MockInterviewSession;
import com.interview_platform_backend.interview_platform_backend.interviewcoaching.service.InterviewCoachingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/interview-coaching")
@RequiredArgsConstructor
public class InterviewCoachingController {

    private final InterviewCoachingService coachingService;

    @PostMapping("/start")
    public ResponseEntity<MockInterviewSession> startMockInterview(
            @RequestParam UUID candidateId,
            @RequestParam String jobTitle,
            @RequestParam String type) {
        MockInterviewSession session = coachingService.startMockInterview(candidateId, jobTitle, type);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{sessionId}/ask")
    public ResponseEntity<Map<String, Object>> askQuestion(@PathVariable UUID sessionId) {
        Map<String, Object> result = coachingService.askQuestion(sessionId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{sessionId}/evaluate")
    public ResponseEntity<Map<String, Object>> evaluateAnswer(
            @PathVariable UUID sessionId,
            @RequestBody String answer) {
        Map<String, Object> result = coachingService.evaluateAnswer(sessionId, answer);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{sessionId}/feedback")
    public ResponseEntity<Map<String, Object>> getDetailedFeedback(@PathVariable UUID sessionId) {
        Map<String, Object> result = coachingService.getDetailedFeedback(sessionId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<MockInterviewSession> complete(@PathVariable UUID sessionId) {
        MockInterviewSession session = coachingService.complete(sessionId);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/history/{candidateId}")
    public ResponseEntity<List<MockInterviewSession>> getHistory(@PathVariable UUID candidateId) {
        return ResponseEntity.ok(coachingService.getHistory(candidateId));
    }
}
