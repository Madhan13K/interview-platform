package com.interview_platform_backend.interview_platform_backend.aicopilot.controller;

import com.interview_platform_backend.interview_platform_backend.aicopilot.dto.CopilotDashboard;
import com.interview_platform_backend.interview_platform_backend.aicopilot.dto.CopilotSuggestion;
import com.interview_platform_backend.interview_platform_backend.aicopilot.entity.CopilotSession;
import com.interview_platform_backend.interview_platform_backend.aicopilot.service.AICopilotV2Service;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/copilot")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','INTERVIEWER')")
public class AICopilotController {

    private static final Logger log = LoggerFactory.getLogger(AICopilotController.class);

    private final AICopilotV2Service copilotService;

    @PostMapping("/start")
    public ResponseEntity<CopilotSession> startSession(@RequestBody StartCopilotRequest request) {
        log.info("Starting copilot session for interview: {}", request.interviewId());
        CopilotSession session = copilotService.startCopilotSession(
                request.interviewId(),
                request.interviewerId(),
                request.competencies(),
                request.totalMinutes()
        );
        return ResponseEntity.ok(session);
    }

    @PostMapping("/{sessionId}/update")
    public ResponseEntity<List<CopilotSuggestion>> processUpdate(
            @PathVariable UUID sessionId,
            @RequestBody TranscriptUpdateRequest request) {
        log.debug("Processing transcript update for copilot session: {}", sessionId);
        List<CopilotSuggestion> suggestions = copilotService.processTranscriptUpdate(
                sessionId, request.newText(), request.elapsedMinutes());
        return ResponseEntity.ok(suggestions);
    }

    @GetMapping("/{sessionId}/dashboard")
    public ResponseEntity<CopilotDashboard> getDashboard(@PathVariable UUID sessionId) {
        CopilotDashboard dashboard = copilotService.getDashboard(sessionId);
        return ResponseEntity.ok(dashboard);
    }

    @PostMapping("/{sessionId}/end")
    public ResponseEntity<CopilotSession> endSession(@PathVariable UUID sessionId) {
        log.info("Ending copilot session: {}", sessionId);
        CopilotSession session = copilotService.endSession(sessionId);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/interview/{interviewId}")
    public ResponseEntity<CopilotSession> getByInterview(@PathVariable UUID interviewId) {
        CopilotSession session = copilotService.getSessionByInterview(interviewId);
        return ResponseEntity.ok(session);
    }

    public record StartCopilotRequest(
            UUID interviewId,
            UUID interviewerId,
            List<String> competencies,
            int totalMinutes
    ) {}

    public record TranscriptUpdateRequest(
            String newText,
            int elapsedMinutes
    ) {}
}
