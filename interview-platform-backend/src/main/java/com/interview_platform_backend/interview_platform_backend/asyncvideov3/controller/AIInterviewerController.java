package com.interview_platform_backend.interview_platform_backend.asyncvideov3.controller;

import com.interview_platform_backend.interview_platform_backend.asyncvideov3.entity.AIInterviewSession;
import com.interview_platform_backend.interview_platform_backend.asyncvideov3.service.AIInterviewerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai-interviewer")
@RequiredArgsConstructor
public class AIInterviewerController {

    private final AIInterviewerService aiInterviewerService;

    @PostMapping("/sessions")
    public ResponseEntity<AIInterviewSession> createSession(@RequestParam UUID jobId,
                                                             @RequestParam UUID candidateId) {
        AIInterviewSession session = aiInterviewerService.createSession(jobId, candidateId);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<AIInterviewSession> getSession(@PathVariable UUID sessionId) {
        AIInterviewSession session = aiInterviewerService.getSession(sessionId);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/sessions/{sessionId}/next-question")
    public ResponseEntity<Map<String, Object>> generateNextQuestion(@PathVariable UUID sessionId) {
        Map<String, Object> question = aiInterviewerService.generateNextQuestion(sessionId);
        return ResponseEntity.ok(question);
    }

    @PostMapping("/sessions/{sessionId}/respond")
    public ResponseEntity<AIInterviewSession> processResponse(@PathVariable UUID sessionId,
                                                               @RequestBody Map<String, String> body) {
        String response = body.getOrDefault("response", "");
        AIInterviewSession session = aiInterviewerService.processResponse(sessionId, response);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/sessions/{sessionId}/follow-up")
    public ResponseEntity<Map<String, Object>> generateFollowUp(@PathVariable UUID sessionId) {
        Map<String, Object> followUp = aiInterviewerService.generateFollowUp(sessionId);
        return ResponseEntity.ok(followUp);
    }

    @PostMapping("/sessions/{sessionId}/complete")
    public ResponseEntity<AIInterviewSession> scoreAndComplete(@PathVariable UUID sessionId) {
        AIInterviewSession session = aiInterviewerService.scoreAndComplete(sessionId);
        return ResponseEntity.ok(session);
    }
}
