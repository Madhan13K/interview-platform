package com.interview_platform_backend.interview_platform_backend.iso27001.controller;

import com.interview_platform_backend.interview_platform_backend.iso27001.entity.IsmsPolicy;
import com.interview_platform_backend.interview_platform_backend.iso27001.entity.RiskAssessment;
import com.interview_platform_backend.interview_platform_backend.iso27001.service.Iso27001Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/iso27001")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class Iso27001Controller {

    private final Iso27001Service iso27001Service;

    // ===== Policy Endpoints =====

    @GetMapping("/policies")
    public ResponseEntity<List<IsmsPolicy>> getAllPolicies() {
        return ResponseEntity.ok(iso27001Service.getAllPolicies());
    }

    @PostMapping("/policies")
    public ResponseEntity<IsmsPolicy> createPolicy(@RequestBody IsmsPolicy policy) {
        IsmsPolicy created = iso27001Service.createPolicy(policy);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/policies/{category}")
    public ResponseEntity<List<IsmsPolicy>> getPoliciesByCategory(
            @PathVariable IsmsPolicy.PolicyCategory category) {
        return ResponseEntity.ok(iso27001Service.getPoliciesByCategory(category));
    }

    @PostMapping("/policies/{id}/approve")
    public ResponseEntity<IsmsPolicy> approvePolicy(@PathVariable UUID id,
                                                    @RequestParam UUID approvedBy) {
        IsmsPolicy approved = iso27001Service.approvePolicy(id, approvedBy);
        return ResponseEntity.ok(approved);
    }

    // ===== Risk Endpoints =====

    @GetMapping("/risks")
    public ResponseEntity<List<RiskAssessment>> getAllRisks() {
        return ResponseEntity.ok(iso27001Service.getAllPolicies() != null
                ? iso27001Service.getHighRisks() : List.of());
    }

    @PostMapping("/risks")
    public ResponseEntity<RiskAssessment> createRisk(@RequestBody RiskAssessment risk) {
        RiskAssessment created = iso27001Service.createRiskAssessment(risk);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/risks/matrix")
    public ResponseEntity<Map<String, Object>> getRiskMatrix() {
        return ResponseEntity.ok(iso27001Service.getRiskMatrix());
    }

    @GetMapping("/risks/high")
    public ResponseEntity<List<RiskAssessment>> getHighRisks() {
        return ResponseEntity.ok(iso27001Service.getHighRisks());
    }

    // ===== Statement of Applicability =====

    @GetMapping("/soa")
    public ResponseEntity<Map<String, Object>> getStatementOfApplicability() {
        return ResponseEntity.ok(iso27001Service.generateStatementOfApplicability());
    }
}
