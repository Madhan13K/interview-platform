package com.interview_platform_backend.interview_platform_backend.compensation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * AI-Powered Compensation Intelligence Service.
 * Provides salary recommendations based on:
 * - Internal offer history (what similar roles were offered)
 * - Experience level and location
 * - Market data approximation
 * - Candidate expectation alignment
 */
@Service
public class CompensationIntelligenceService {

    private static final Logger log = LoggerFactory.getLogger(CompensationIntelligenceService.class);

    @PersistenceContext
    private EntityManager entityManager;

    // Market data approximation (production would integrate with Levels.fyi, Glassdoor, etc.)
    private static final Map<String, Map<String, int[]>> MARKET_DATA = Map.of(
            "JUNIOR", Map.of("US", new int[]{70000, 100000}, "IN", new int[]{600000, 1200000}, "EU", new int[]{40000, 65000}),
            "MID", Map.of("US", new int[]{100000, 160000}, "IN", new int[]{1200000, 2500000}, "EU", new int[]{60000, 95000}),
            "SENIOR", Map.of("US", new int[]{150000, 220000}, "IN", new int[]{2500000, 5000000}, "EU", new int[]{85000, 140000}),
            "STAFF", Map.of("US", new int[]{200000, 300000}, "IN", new int[]{4000000, 8000000}, "EU", new int[]{120000, 200000}),
            "PRINCIPAL", Map.of("US", new int[]{250000, 400000}, "IN", new int[]{6000000, 12000000}, "EU", new int[]{150000, 280000})
    );

    public CompensationRecommendation recommend(String level, String location, String department, String currency) {
        log.info("Generating compensation recommendation: level={}, location={}, dept={}", level, location, department);

        String region = mapLocationToRegion(location);
        String normalizedLevel = normalizeLevel(level);
        int[] marketRange = MARKET_DATA.getOrDefault(normalizedLevel, MARKET_DATA.get("MID")).getOrDefault(region, new int[]{80000, 150000});

        // Get internal offer history for similar roles
        InternalBenchmark internal = getInternalBenchmark(department, normalizedLevel);

        // Calculate recommendation
        int marketMin = marketRange[0];
        int marketMax = marketRange[1];
        int marketMid = (marketMin + marketMax) / 2;

        // Blend market data with internal data
        int recommendedMin = internal.avgOffer > 0 ? (int) ((marketMin * 0.6) + (internal.avgOffer * 0.4 * 0.9)) : marketMin;
        int recommendedMax = internal.avgOffer > 0 ? (int) ((marketMax * 0.6) + (internal.avgOffer * 0.4 * 1.1)) : marketMax;
        int recommendedTarget = (recommendedMin + recommendedMax) / 2;

        String adjustedCurrency = currency != null ? currency : (region.equals("IN") ? "INR" : region.equals("EU") ? "EUR" : "USD");

        return new CompensationRecommendation(
                adjustedCurrency,
                BigDecimal.valueOf(recommendedMin),
                BigDecimal.valueOf(recommendedTarget),
                BigDecimal.valueOf(recommendedMax),
                BigDecimal.valueOf(marketMin),
                BigDecimal.valueOf(marketMax),
                internal.avgOffer > 0 ? BigDecimal.valueOf((long) internal.avgOffer) : null,
                internal.sampleSize,
                normalizedLevel,
                region,
                generateInsights(marketMid, internal, normalizedLevel)
        );
    }

    public OfferCompetitiveness assessOffer(BigDecimal offeredAmount, String level, String location) {
        String region = mapLocationToRegion(location);
        String normalizedLevel = normalizeLevel(level);
        int[] marketRange = MARKET_DATA.getOrDefault(normalizedLevel, MARKET_DATA.get("MID")).getOrDefault(region, new int[]{80000, 150000});

        double percentile = (offeredAmount.doubleValue() - marketRange[0]) / (marketRange[1] - marketRange[0]) * 100;
        percentile = Math.max(0, Math.min(100, percentile));

        String rating;
        if (percentile >= 75) rating = "HIGHLY_COMPETITIVE";
        else if (percentile >= 50) rating = "COMPETITIVE";
        else if (percentile >= 25) rating = "BELOW_MARKET";
        else rating = "SIGNIFICANTLY_BELOW_MARKET";

        return new OfferCompetitiveness(offeredAmount, BigDecimal.valueOf(marketRange[0]), BigDecimal.valueOf(marketRange[1]), percentile, rating);
    }

    private InternalBenchmark getInternalBenchmark(String department, String level) {
        try {
            var result = entityManager.createQuery(
                    "SELECT AVG(o.salary), COUNT(o) FROM OfferLetter o WHERE o.status = 'ACCEPTED' AND o.jobPosition.department = :dept", Object[].class)
                    .setParameter("dept", department).getSingleResult();
            double avg = result[0] != null ? ((Number) result[0]).doubleValue() : 0;
            long count = result[1] != null ? ((Number) result[1]).longValue() : 0;
            return new InternalBenchmark(avg, count);
        } catch (Exception e) { return new InternalBenchmark(0, 0); }
    }

    private String mapLocationToRegion(String location) {
        if (location == null) return "US";
        String lower = location.toLowerCase();
        if (lower.contains("india") || lower.contains("bangalore") || lower.contains("mumbai") || lower.contains("hyderabad") || lower.contains("delhi")) return "IN";
        if (lower.contains("uk") || lower.contains("germany") || lower.contains("france") || lower.contains("europe") || lower.contains("london") || lower.contains("berlin")) return "EU";
        return "US";
    }

    private String normalizeLevel(String level) {
        if (level == null) return "MID";
        return switch (level.toUpperCase()) {
            case "JUNIOR", "ENTRY", "ASSOCIATE" -> "JUNIOR";
            case "MID", "INTERMEDIATE" -> "MID";
            case "SENIOR", "SR" -> "SENIOR";
            case "STAFF", "LEAD" -> "STAFF";
            case "PRINCIPAL", "ARCHITECT", "DISTINGUISHED", "FELLOW" -> "PRINCIPAL";
            default -> "MID";
        };
    }

    private List<String> generateInsights(int marketMid, InternalBenchmark internal, String level) {
        List<String> insights = new ArrayList<>();
        insights.add(level + "-level market midpoint: " + marketMid);
        if (internal.sampleSize > 0) {
            insights.add("Internal benchmark based on " + internal.sampleSize + " accepted offers");
            if (internal.avgOffer < marketMid * 0.9) insights.add("Internal offers are below market - consider adjustment");
        } else {
            insights.add("No internal benchmark data - using market data only");
        }
        return insights;
    }

    record InternalBenchmark(double avgOffer, long sampleSize) {}
    public record CompensationRecommendation(String currency, BigDecimal recommendedMin, BigDecimal recommendedTarget, BigDecimal recommendedMax, BigDecimal marketMin, BigDecimal marketMax, BigDecimal internalAverage, long internalSampleSize, String level, String region, List<String> insights) {}
    public record OfferCompetitiveness(BigDecimal offered, BigDecimal marketMin, BigDecimal marketMax, double percentile, String rating) {}
}
