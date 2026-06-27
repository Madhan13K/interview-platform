package com.interview_platform_backend.interview_platform_backend.soc2.controller;

import com.interview_platform_backend.interview_platform_backend.soc2.entity.Soc2Control;
import com.interview_platform_backend.interview_platform_backend.soc2.entity.Soc2Evidence;
import com.interview_platform_backend.interview_platform_backend.soc2.service.Soc2ComplianceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/soc2")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class Soc2Controller {

    private final Soc2ComplianceService soc2ComplianceService;

    @GetMapping("/controls")
    public ResponseEntity<List<Soc2Control>> getAllControls() {
        return ResponseEntity.ok(soc2ComplianceService.getAllControls());
    }

    @GetMapping("/controls/{category}")
    public ResponseEntity<List<Soc2Control>> getControlsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(soc2ComplianceService.getControlsByCategory(category));
    }

    @PostMapping("/controls/{id}/evidence")
    public ResponseEntity<Soc2Evidence> collectEvidence(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        log.info("REST: Collecting evidence for control {}", id);
        Soc2Evidence.EvidenceType evidenceType = Soc2Evidence.EvidenceType.valueOf(body.get("evidenceType"));
        String title = body.get("title");
        String description = body.get("description");
        String fileUrl = body.get("fileUrl");
        String collectedBy = body.getOrDefault("collectedBy", "AUTOMATED");

        Soc2Evidence evidence = soc2ComplianceService.collectEvidence(
                id, evidenceType, title, description, fileUrl, collectedBy);
        return ResponseEntity.status(HttpStatus.CREATED).body(evidence);
    }

    @PostMapping("/automated-check")
    public ResponseEntity<Map<String, Object>> runAutomatedChecks() {
        log.info("REST: Running SOC 2 automated checks");
        return ResponseEntity.ok(soc2ComplianceService.runAutomatedChecks());
    }

    @GetMapping("/readiness")
    public ResponseEntity<Map<String, Object>> getReadiness() {
        return ResponseEntity.ok(soc2ComplianceService.getTypeIReadiness());
    }

    @GetMapping("/score")
    public ResponseEntity<Map<String, Object>> getComplianceScore() {
        return ResponseEntity.ok(soc2ComplianceService.getComplianceScore());
    }

    @GetMapping("/audit-report")
    public ResponseEntity<Map<String, Object>> generateAuditReport() {
        log.info("REST: Generating SOC 2 audit report");
        return ResponseEntity.ok(soc2ComplianceService.generateAuditReport());
    }

    @GetMapping("/timeline")
    public ResponseEntity<Map<String, Object>> getTypeIITimeline() {
        return ResponseEntity.ok(soc2ComplianceService.getTypeIITimeline());
    }
}
