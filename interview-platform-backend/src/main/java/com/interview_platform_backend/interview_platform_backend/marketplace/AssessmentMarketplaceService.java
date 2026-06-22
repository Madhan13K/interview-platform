package com.interview_platform_backend.interview_platform_backend.marketplace;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Skills Assessment Marketplace Service.
 * Integrates with third-party assessment providers:
 * - HackerRank, Codility, TestGorilla, Criteria Corp, etc.
 * Provides a unified API for ordering, tracking, and scoring assessments.
 */
@Service
public class AssessmentMarketplaceService {

    private static final Logger log = LoggerFactory.getLogger(AssessmentMarketplaceService.class);

    // Registry of available assessment providers
    private static final List<AssessmentProvider> PROVIDERS = List.of(
            new AssessmentProvider("hackerrank", "HackerRank", "Technical coding assessments", List.of("CODING", "ALGORITHMS", "DATA_STRUCTURES"), true),
            new AssessmentProvider("codility", "Codility", "Real-world coding challenges", List.of("CODING", "SYSTEM_DESIGN"), true),
            new AssessmentProvider("testgorilla", "TestGorilla", "Pre-employment testing", List.of("PERSONALITY", "COGNITIVE", "LANGUAGE", "ROLE_SPECIFIC"), true),
            new AssessmentProvider("criteria", "Criteria Corp", "Cognitive and personality assessments", List.of("COGNITIVE", "PERSONALITY", "EMOTIONAL_INTELLIGENCE"), false),
            new AssessmentProvider("vervoe", "Vervoe", "AI-powered skills assessments", List.of("ROLE_SPECIFIC", "COMMUNICATION", "SALES"), false),
            new AssessmentProvider("pluralsight", "Pluralsight Skills", "Technology skill assessments", List.of("CODING", "DEVOPS", "CLOUD", "DATA"), true)
    );

    /**
     * List all available assessment providers.
     */
    public List<AssessmentProvider> listProviders() {
        return PROVIDERS;
    }

    /**
     * List providers by assessment category.
     */
    public List<AssessmentProvider> listProvidersByCategory(String category) {
        return PROVIDERS.stream()
                .filter(p -> p.categories().contains(category.toUpperCase()))
                .toList();
    }

    /**
     * Get available assessments from a provider.
     */
    public List<Assessment> getAvailableAssessments(String providerId) {
        // In production, this would call the provider's API
        return switch (providerId.toLowerCase()) {
            case "hackerrank" -> List.of(
                    new Assessment("hr-java-mid", "Java Mid-Level", "CODING", 60, "MEDIUM"),
                    new Assessment("hr-react-sr", "React Senior", "CODING", 90, "HARD"),
                    new Assessment("hr-algo-basic", "Algorithms Basics", "ALGORITHMS", 45, "EASY")
            );
            case "codility" -> List.of(
                    new Assessment("cod-fullstack", "Full Stack Challenge", "CODING", 120, "HARD"),
                    new Assessment("cod-sql", "SQL Assessment", "DATA_STRUCTURES", 30, "MEDIUM")
            );
            case "testgorilla" -> List.of(
                    new Assessment("tg-disc", "DISC Personality", "PERSONALITY", 15, "EASY"),
                    new Assessment("tg-cog", "Cognitive Ability", "COGNITIVE", 20, "MEDIUM"),
                    new Assessment("tg-eng", "English Proficiency", "LANGUAGE", 25, "MEDIUM")
            );
            default -> List.of();
        };
    }

    /**
     * Order an assessment for a candidate.
     */
    public AssessmentOrder orderAssessment(String providerId, String assessmentId, String candidateEmail, String candidateName) {
        log.info("Ordering assessment {} from {} for candidate {}", assessmentId, providerId, candidateEmail);
        // In production, call provider's API to create the assessment invitation
        String orderId = UUID.randomUUID().toString().substring(0, 8);
        String inviteUrl = "https://" + providerId + ".com/assessments/" + orderId + "/take";

        return new AssessmentOrder(orderId, providerId, assessmentId, candidateEmail, "INVITED", inviteUrl);
    }

    /**
     * Get assessment result from a provider.
     */
    public AssessmentResult getResult(String providerId, String orderId) {
        log.info("Fetching result for order {} from {}", orderId, providerId);
        // In production, call provider's API for results
        return new AssessmentResult(orderId, providerId, "COMPLETED", 78.5, "Above Average", Map.of(
                "correctAnswers", 15,
                "totalQuestions", 20,
                "timeSpent", "42 minutes",
                "percentile", 72
        ));
    }

    public record AssessmentProvider(String id, String name, String description, List<String> categories, boolean active) {}
    public record Assessment(String id, String name, String category, int durationMinutes, String difficulty) {}
    public record AssessmentOrder(String orderId, String providerId, String assessmentId, String candidateEmail, String status, String inviteUrl) {}
    public record AssessmentResult(String orderId, String providerId, String status, double score, String verdict, Map<String, Object> details) {}
}
