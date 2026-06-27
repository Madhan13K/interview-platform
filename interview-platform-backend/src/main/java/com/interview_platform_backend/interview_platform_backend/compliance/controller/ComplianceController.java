package com.interview_platform_backend.interview_platform_backend.compliance.controller;

import com.interview_platform_backend.interview_platform_backend.compliance.entity.ComplianceAuditRun;
import com.interview_platform_backend.interview_platform_backend.compliance.entity.ComplianceCheck;
import com.interview_platform_backend.interview_platform_backend.compliance.service.ComplianceAuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/compliance")
@PreAuthorize("hasRole('ADMIN')")
public class ComplianceController {

    private final ComplianceAuditService auditService;

    public ComplianceController(ComplianceAuditService auditService) {
        this.auditService = auditService;
    }

    @PostMapping("/audit/{type}")
    public ResponseEntity<ComplianceAuditRun> triggerAudit(@PathVariable String type) {
        ComplianceAuditRun result = auditService.runAudit(type);
        auditService.scheduleNextAudit(result.getId());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/audit/{type}/latest")
    public ResponseEntity<ComplianceAuditRun> getLatestAudit(@PathVariable String type) {
        return auditService.getLatestAudit(type)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/audit/{type}/history")
    public ResponseEntity<List<ComplianceAuditRun>> getAuditHistory(
            @PathVariable String type,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(auditService.getAuditHistory(type, limit));
    }

    @GetMapping("/checks/{auditRunId}")
    public ResponseEntity<List<ComplianceCheck>> getChecksForAudit(@PathVariable UUID auditRunId) {
        List<ComplianceCheck> checks = auditService.getChecksForAudit(auditRunId);
        if (checks.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(checks);
    }
}
