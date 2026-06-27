package com.interview_platform_backend.interview_platform_backend.hipaa.controller;

import com.interview_platform_backend.interview_platform_backend.hipaa.entity.BusinessAssociateAgreement;
import com.interview_platform_backend.interview_platform_backend.hipaa.entity.HipaaAuditLog;
import com.interview_platform_backend.interview_platform_backend.hipaa.entity.HipaaConsentRecord;
import com.interview_platform_backend.interview_platform_backend.hipaa.service.HipaaComplianceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/hipaa")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class HipaaController {

    private final HipaaComplianceService hipaaService;

    // ===== Audit Log =====

    @GetMapping("/audit-log")
    public ResponseEntity<List<HipaaAuditLog>> getAuditLog(
            @RequestParam(required = false) String patient,
            @RequestParam(required = false) Instant since,
            @RequestParam(required = false) HipaaAuditLog.AuditAction action) {
        if (patient != null) {
            List<HipaaAuditLog> logs = hipaaService.getAccessLog(patient, since);
            return ResponseEntity.ok(logs);
        }
        // Return empty if no patient filter specified for privacy
        return ResponseEntity.ok(List.of());
    }

    // ===== Consent =====

    @PostMapping("/consent")
    public ResponseEntity<HipaaConsentRecord> recordConsent(@RequestBody HipaaConsentRecord consent) {
        HipaaConsentRecord created = hipaaService.recordConsent(consent);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/consent/{id}")
    public ResponseEntity<HipaaConsentRecord> revokeConsent(@PathVariable UUID id) {
        HipaaConsentRecord revoked = hipaaService.revokeConsent(id);
        return ResponseEntity.ok(revoked);
    }

    // ===== Business Associate Agreements =====

    @GetMapping("/baa")
    public ResponseEntity<List<BusinessAssociateAgreement>> getActiveBAAs() {
        return ResponseEntity.ok(hipaaService.getActiveBAAs());
    }

    @PostMapping("/baa")
    public ResponseEntity<BusinessAssociateAgreement> createBAA(
            @RequestBody BusinessAssociateAgreement baa) {
        BusinessAssociateAgreement created = hipaaService.createBAA(baa);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ===== Compliance Audit =====

    @PostMapping("/audit-check")
    public ResponseEntity<Map<String, Object>> runAuditCheck() {
        return ResponseEntity.ok(hipaaService.runHipaaAudit());
    }

    @GetMapping("/compliance-score")
    public ResponseEntity<Map<String, Object>> getComplianceScore() {
        return ResponseEntity.ok(hipaaService.getComplianceScore());
    }
}
