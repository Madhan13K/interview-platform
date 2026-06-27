package com.interview_platform_backend.interview_platform_backend.iso27001.service;

import com.interview_platform_backend.interview_platform_backend.iso27001.entity.IsmsPolicy;
import com.interview_platform_backend.interview_platform_backend.iso27001.entity.RiskAssessment;
import com.interview_platform_backend.interview_platform_backend.iso27001.repository.IsmsPolicyRepository;
import com.interview_platform_backend.interview_platform_backend.iso27001.repository.RiskAssessmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class Iso27001Service {

    private final IsmsPolicyRepository policyRepository;
    private final RiskAssessmentRepository riskRepository;

    // ===== Policy Management =====

    public IsmsPolicy createPolicy(IsmsPolicy policy) {
        log.info("Creating ISMS policy: {} - {}", policy.getPolicyNumber(), policy.getTitle());
        policy.setStatus(IsmsPolicy.PolicyStatus.DRAFT);
        return policyRepository.save(policy);
    }

    public IsmsPolicy approvePolicy(UUID policyId, UUID approvedBy) {
        log.info("Approving ISMS policy: {} by user: {}", policyId, approvedBy);
        IsmsPolicy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new NoSuchElementException("Policy not found: " + policyId));
        policy.setStatus(IsmsPolicy.PolicyStatus.APPROVED);
        policy.setApprovedBy(approvedBy);
        policy.setEffectiveDate(Instant.now());
        return policyRepository.save(policy);
    }

    @Transactional(readOnly = true)
    public List<IsmsPolicy> getAllPolicies() {
        return policyRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<IsmsPolicy> getPoliciesByCategory(IsmsPolicy.PolicyCategory category) {
        return policyRepository.findByCategory(category);
    }

    // ===== Risk Assessment =====

    public RiskAssessment createRiskAssessment(RiskAssessment risk) {
        log.info("Creating risk assessment: {}", risk.getRiskTitle());
        risk.setStatus(RiskAssessment.RiskStatus.IDENTIFIED);
        risk.calculateRiskScore();
        return riskRepository.save(risk);
    }

    public RiskAssessment assessRisk(UUID riskId, RiskAssessment.Likelihood likelihood,
                                     RiskAssessment.Impact impact,
                                     RiskAssessment.ResidualRisk residualRisk) {
        log.info("Assessing risk: {}", riskId);
        RiskAssessment risk = riskRepository.findById(riskId)
                .orElseThrow(() -> new NoSuchElementException("Risk assessment not found: " + riskId));
        risk.setLikelihood(likelihood);
        risk.setImpact(impact);
        risk.calculateRiskScore();
        risk.setResidualRisk(residualRisk);
        risk.setStatus(RiskAssessment.RiskStatus.ASSESSED);
        return riskRepository.save(risk);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRiskMatrix() {
        List<RiskAssessment> allRisks = riskRepository.findAll();
        int[][] matrix = new int[5][5];

        for (RiskAssessment risk : allRisks) {
            int likelihoodIdx = risk.getLikelihoodValue() - 1;
            int impactIdx = risk.getImpactValue() - 1;
            if (likelihoodIdx >= 0 && likelihoodIdx < 5 && impactIdx >= 0 && impactIdx < 5) {
                matrix[likelihoodIdx][impactIdx]++;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("matrix", matrix);
        result.put("likelihoodLabels", Arrays.asList("VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"));
        result.put("impactLabels", Arrays.asList("VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"));
        result.put("totalRisks", allRisks.size());
        return result;
    }

    @Transactional(readOnly = true)
    public List<RiskAssessment> getHighRisks() {
        return riskRepository.findByResidualRiskIn(
                List.of(RiskAssessment.ResidualRisk.HIGH, RiskAssessment.ResidualRisk.CRITICAL));
    }

    @Transactional(readOnly = true)
    public double calculateOverallRiskScore() {
        List<RiskAssessment> allRisks = riskRepository.findAll();
        if (allRisks.isEmpty()) return 0.0;
        return allRisks.stream()
                .mapToInt(RiskAssessment::getRiskScore)
                .average()
                .orElse(0.0);
    }

    @Transactional(readOnly = true)
    public List<IsmsPolicy> getNextReviewDue() {
        return policyRepository.findByReviewDateBeforeOrderByReviewDateAsc(
                Instant.now().plusSeconds(30L * 24 * 60 * 60)); // within next 30 days
    }

    @Transactional(readOnly = true)
    public Map<String, Object> generateStatementOfApplicability() {
        log.info("Generating Statement of Applicability (SoA)");
        List<IsmsPolicy> allPolicies = policyRepository.findAll();

        Map<String, Object> soa = new LinkedHashMap<>();
        soa.put("generatedAt", Instant.now().toString());
        soa.put("totalControls", IsmsPolicy.PolicyCategory.values().length);

        List<Map<String, Object>> controls = new ArrayList<>();
        for (IsmsPolicy.PolicyCategory category : IsmsPolicy.PolicyCategory.values()) {
            Map<String, Object> control = new LinkedHashMap<>();
            control.put("category", category.name());
            List<IsmsPolicy> categoryPolicies = allPolicies.stream()
                    .filter(p -> p.getCategory() == category)
                    .collect(Collectors.toList());
            control.put("applicable", !categoryPolicies.isEmpty());
            control.put("implemented", categoryPolicies.stream()
                    .anyMatch(p -> p.getStatus() == IsmsPolicy.PolicyStatus.ACTIVE
                            || p.getStatus() == IsmsPolicy.PolicyStatus.APPROVED));
            control.put("policyCount", categoryPolicies.size());
            control.put("policies", categoryPolicies.stream()
                    .map(p -> Map.of(
                            "policyNumber", p.getPolicyNumber(),
                            "title", p.getTitle(),
                            "status", p.getStatus().name()))
                    .collect(Collectors.toList()));
            controls.add(control);
        }
        soa.put("controls", controls);

        long implementedCount = controls.stream()
                .filter(c -> Boolean.TRUE.equals(c.get("implemented")))
                .count();
        soa.put("implementedCount", implementedCount);
        soa.put("compliancePercentage",
                (double) implementedCount / IsmsPolicy.PolicyCategory.values().length * 100);

        return soa;
    }
}
