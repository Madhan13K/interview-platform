package com.interview_platform_backend.interview_platform_backend.proctoring.controller;

import com.interview_platform_backend.interview_platform_backend.proctoring.entity.ProctoringSession;
import com.interview_platform_backend.interview_platform_backend.proctoring.service.ProctoringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/proctoring")
@Tag(name = "Proctoring", description = "Video interview proctoring and integrity monitoring")
@PreAuthorize("isAuthenticated()")
public class ProctoringController {

    private final ProctoringService proctoringService;

    public ProctoringController(ProctoringService proctoringService) {
        this.proctoringService = proctoringService;
    }

    @Operation(summary = "Start a proctoring session")
    @PostMapping("/sessions")
    public ResponseEntity<ProctoringSession> startSession(
            @RequestParam UUID interviewId,
            @RequestParam UUID candidateId,
            @RequestParam boolean screenConsent) {
        ProctoringSession session = proctoringService.startSession(interviewId, candidateId, screenConsent);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @Operation(summary = "Report a tab switch event")
    @PostMapping("/sessions/{sessionId}/tab-switch")
    public ResponseEntity<ProctoringSession> reportTabSwitch(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(proctoringService.reportTabSwitch(sessionId));
    }

    @Operation(summary = "Report a face count violation")
    @PostMapping("/sessions/{sessionId}/face-violation")
    public ResponseEntity<ProctoringSession> reportFaceCountViolation(
            @PathVariable UUID sessionId,
            @RequestParam int faceCount) {
        return ResponseEntity.ok(proctoringService.reportFaceCountViolation(sessionId, faceCount));
    }

    @Operation(summary = "Report a suspicious event")
    @PostMapping("/sessions/{sessionId}/suspicious-event")
    public ResponseEntity<ProctoringSession> reportSuspiciousEvent(
            @PathVariable UUID sessionId,
            @RequestParam String eventType,
            @RequestParam String details) {
        return ResponseEntity.ok(proctoringService.reportSuspiciousEvent(sessionId, eventType, details));
    }

    @Operation(summary = "End a proctoring session and calculate integrity score")
    @PostMapping("/sessions/{sessionId}/end")
    public ResponseEntity<ProctoringSession> endSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(proctoringService.endSession(sessionId));
    }

    @Operation(summary = "Get a proctoring session by ID")
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<ProctoringSession> getSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(proctoringService.getSession(sessionId));
    }

    @Operation(summary = "Get all flagged proctoring sessions")
    @GetMapping("/sessions/flagged")
    @PreAuthorize("hasAnyRole('ADMIN','RECRUITER')")
    public ResponseEntity<List<ProctoringSession>> getFlaggedSessions() {
        return ResponseEntity.ok(proctoringService.getFlaggedSessions());
    }
}
