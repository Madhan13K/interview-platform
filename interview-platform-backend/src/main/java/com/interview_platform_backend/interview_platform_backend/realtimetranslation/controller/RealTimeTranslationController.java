package com.interview_platform_backend.interview_platform_backend.realtimetranslation.controller;

import com.interview_platform_backend.interview_platform_backend.realtimetranslation.entity.TranslationSession;
import com.interview_platform_backend.interview_platform_backend.realtimetranslation.service.RealTimeTranslationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/translation")
@Tag(name = "Real-time Translation", description = "Real-time interview translation powered by AI")
@PreAuthorize("isAuthenticated()")
public class RealTimeTranslationController {

    private final RealTimeTranslationService realTimeTranslationService;

    public RealTimeTranslationController(RealTimeTranslationService realTimeTranslationService) {
        this.realTimeTranslationService = realTimeTranslationService;
    }

    @Operation(summary = "Start a new translation session")
    @PostMapping("/sessions")
    public ResponseEntity<TranslationSession> startSession(
            @RequestParam UUID interviewId,
            @RequestParam String sourceLang,
            @RequestParam String targetLang) {
        TranslationSession session = realTimeTranslationService.startSession(interviewId, sourceLang, targetLang);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    @Operation(summary = "Translate a text segment")
    @PostMapping("/sessions/{sessionId}/translate")
    public ResponseEntity<Map<String, Object>> translateSegment(
            @PathVariable UUID sessionId,
            @RequestBody String text) {
        return ResponseEntity.ok(realTimeTranslationService.translateSegment(sessionId, text));
    }

    @Operation(summary = "End a translation session")
    @PostMapping("/sessions/{sessionId}/end")
    public ResponseEntity<TranslationSession> endSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(realTimeTranslationService.endSession(sessionId));
    }

    @Operation(summary = "Get supported languages")
    @GetMapping("/languages")
    public ResponseEntity<List<Map<String, String>>> getSupportedLanguages() {
        return ResponseEntity.ok(realTimeTranslationService.getSupportedLanguages());
    }

    @Operation(summary = "Get a translation session by ID")
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<TranslationSession> getSession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(realTimeTranslationService.getSession(sessionId));
    }
}
