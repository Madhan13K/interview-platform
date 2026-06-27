package com.interview_platform_backend.interview_platform_backend.referencecheck.controller;

import com.interview_platform_backend.interview_platform_backend.referencecheck.entity.ReferenceCheck;
import com.interview_platform_backend.interview_platform_backend.referencecheck.service.ReferenceCheckService;
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
@RequestMapping("/api/v1/reference-checks")
@Tag(name = "Reference Checks", description = "Automated reference checking with AI-generated questionnaires")
@PreAuthorize("isAuthenticated()")
public class ReferenceCheckController {

    private final ReferenceCheckService referenceCheckService;

    public ReferenceCheckController(ReferenceCheckService referenceCheckService) {
        this.referenceCheckService = referenceCheckService;
    }

    @Operation(summary = "Create a new reference check")
    @PostMapping
    public ResponseEntity<ReferenceCheck> createCheck(
            @RequestParam UUID candidateId,
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String relationship) {
        ReferenceCheck created = referenceCheckService.createCheck(candidateId, name, email, relationship);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Send questionnaire to reference")
    @PostMapping("/{checkId}/send")
    public ResponseEntity<ReferenceCheck> sendQuestionnaire(@PathVariable UUID checkId) {
        return ResponseEntity.ok(referenceCheckService.sendQuestionnaire(checkId));
    }

    @Operation(summary = "Process reference response")
    @PostMapping("/{checkId}/response")
    public ResponseEntity<ReferenceCheck> processResponse(
            @PathVariable UUID checkId,
            @RequestBody Map<String, String> answers) {
        return ResponseEntity.ok(referenceCheckService.processResponse(checkId, answers));
    }

    @Operation(summary = "Generate AI summary for completed reference check")
    @PostMapping("/{checkId}/summary")
    public ResponseEntity<ReferenceCheck> generateAISummary(@PathVariable UUID checkId) {
        return ResponseEntity.ok(referenceCheckService.generateAISummary(checkId));
    }

    @Operation(summary = "Get all reference checks for a candidate")
    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<ReferenceCheck>> getChecksForCandidate(@PathVariable UUID candidateId) {
        return ResponseEntity.ok(referenceCheckService.getChecksForCandidate(candidateId));
    }

    @Operation(summary = "Get completion rate statistics")
    @GetMapping("/completion-rate")
    public ResponseEntity<Map<String, Object>> getCompletionRate() {
        return ResponseEntity.ok(referenceCheckService.getCompletionRate());
    }
}
