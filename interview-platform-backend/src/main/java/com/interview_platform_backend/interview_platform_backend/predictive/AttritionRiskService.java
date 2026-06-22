package com.interview_platform_backend.interview_platform_backend.predictive;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.*;

/**
 * Attrition Risk Prediction Service.
 * Predicts which hired candidates are at risk of leaving within 6 months
 * based on interview signals, offer details, and historical patterns.
 */
@Service
public class AttritionRiskService {

    private static final Logger log = LoggerFactory.getLogger(AttritionRiskService.class);

    @PersistenceContext
    private EntityManager entityManager;

    public AttritionRiskPrediction predictRisk(UUID candidateId) {
        log.info("Predicting attrition risk for candidate: {}", candidateId);

        double riskScore = 0.0;
        List<String> riskFactors = new ArrayList<>();

        // Factor 1: Interview enthusiasm (low ratings = risk)
        double avgRating = getAverageInterviewRating(candidateId);
        if (avgRating < 3.0) { riskScore += 0.2; riskFactors.add("Low interview ratings (enthusiasm concern)"); }

        // Factor 2: Multiple offers (counteroffer risk)
        boolean hasMultipleProcesses = hasMultipleActiveProcesses(candidateId);
        if (hasMultipleProcesses) { riskScore += 0.15; riskFactors.add("Active in multiple hiring processes"); }

        // Factor 3: Salary below expectations
        double salaryGap = getSalaryGap(candidateId);
        if (salaryGap < -0.1) { riskScore += 0.25; riskFactors.add("Offer below candidate expectation by " + Math.round(Math.abs(salaryGap) * 100) + "%"); }

        // Factor 4: Long time-to-close (candidate may have gone cold)
        long daysInProcess = getDaysInProcess(candidateId);
        if (daysInProcess > 45) { riskScore += 0.15; riskFactors.add("Long hiring process (" + daysInProcess + " days) - engagement may have dropped"); }

        // Factor 5: Job hopper pattern
        boolean isJobHopper = isFrequentJobChanger(candidateId);
        if (isJobHopper) { riskScore += 0.2; riskFactors.add("History suggests frequent role changes"); }

        // Factor 6: Location mismatch
        boolean locationMismatch = hasLocationConcerns(candidateId);
        if (locationMismatch) { riskScore += 0.1; riskFactors.add("Location/remote preference mismatch noted"); }

        riskScore = Math.min(1.0, riskScore);
        String riskLevel = riskScore >= 0.6 ? "HIGH" : riskScore >= 0.3 ? "MEDIUM" : "LOW";

        List<String> mitigations = generateMitigations(riskFactors);

        return new AttritionRiskPrediction(candidateId, riskScore, riskLevel, riskFactors, mitigations);
    }

    private double getAverageInterviewRating(UUID candidateId) {
        try {
            var result = entityManager.createQuery("SELECT AVG(f.rating) FROM InterviewFeedBack f WHERE f.interview.candidate.id = :id", Double.class)
                    .setParameter("id", candidateId).getSingleResult();
            return result != null ? result : 3.5;
        } catch (Exception e) { return 3.5; }
    }

    private boolean hasMultipleActiveProcesses(UUID candidateId) { return false; } // Placeholder
    private double getSalaryGap(UUID candidateId) { return 0; } // Placeholder
    private long getDaysInProcess(UUID candidateId) { return 20; } // Placeholder
    private boolean isFrequentJobChanger(UUID candidateId) { return false; } // Placeholder
    private boolean hasLocationConcerns(UUID candidateId) { return false; } // Placeholder

    private List<String> generateMitigations(List<String> riskFactors) {
        List<String> mitigations = new ArrayList<>();
        for (String factor : riskFactors) {
            if (factor.contains("salary")) mitigations.add("Consider signing bonus or equity to close gap");
            if (factor.contains("enthusiasm")) mitigations.add("Assign mentor and ensure strong onboarding");
            if (factor.contains("multiple")) mitigations.add("Accelerate offer timeline and express strong interest");
            if (factor.contains("Long hiring")) mitigations.add("Send personalized welcome package before start date");
            if (factor.contains("job changes")) mitigations.add("Discuss career growth path during onboarding");
        }
        if (mitigations.isEmpty()) mitigations.add("Standard onboarding process appropriate");
        return mitigations;
    }

    public record AttritionRiskPrediction(UUID candidateId, double riskScore, String riskLevel, List<String> riskFactors, List<String> mitigations) {}
}
