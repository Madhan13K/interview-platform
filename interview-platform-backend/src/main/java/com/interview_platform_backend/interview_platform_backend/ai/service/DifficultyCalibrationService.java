package com.interview_platform_backend.interview_platform_backend.ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Interview Difficulty Calibration Service.
 * Automatically adjusts question difficulty based on candidate performance in real-time.
 * Uses adaptive testing principles (similar to GRE/GMAT computer-adaptive tests).
 */
@Service
public class DifficultyCalibrationService {

    private static final Logger log = LoggerFactory.getLogger(DifficultyCalibrationService.class);

    public enum Difficulty { EASY, MEDIUM, HARD, EXPERT }

    /**
     * Determine next question difficulty based on performance so far.
     */
    public CalibrationResult calibrate(List<QuestionResult> performanceHistory) {
        if (performanceHistory.isEmpty()) {
            return new CalibrationResult(Difficulty.MEDIUM, 0.5, "Starting at medium difficulty");
        }

        // Calculate running ability estimate (simplified Item Response Theory)
        double abilityEstimate = calculateAbilityEstimate(performanceHistory);

        // Determine next difficulty
        Difficulty nextDifficulty;
        String reason;

        if (abilityEstimate >= 0.8) {
            nextDifficulty = Difficulty.EXPERT;
            reason = "Candidate excelling - advancing to expert level";
        } else if (abilityEstimate >= 0.6) {
            nextDifficulty = Difficulty.HARD;
            reason = "Strong performance - increasing difficulty";
        } else if (abilityEstimate >= 0.4) {
            nextDifficulty = Difficulty.MEDIUM;
            reason = "Moderate performance - maintaining difficulty";
        } else {
            nextDifficulty = Difficulty.EASY;
            reason = "Struggling - reducing difficulty to build confidence";
        }

        // Check for streak patterns
        if (hasConsecutiveFailures(performanceHistory, 3)) {
            nextDifficulty = reduceDifficulty(nextDifficulty);
            reason = "3 consecutive struggles - stepping down";
        } else if (hasConsecutiveSuccesses(performanceHistory, 3)) {
            nextDifficulty = increaseDifficulty(nextDifficulty);
            reason = "3 consecutive strong answers - stepping up";
        }

        log.debug("Calibration: ability={}, next={}, reason={}", abilityEstimate, nextDifficulty, reason);
        return new CalibrationResult(nextDifficulty, abilityEstimate, reason);
    }

    /**
     * Get final calibrated assessment of candidate level.
     */
    public CandidateLevel assessLevel(List<QuestionResult> fullHistory) {
        double ability = calculateAbilityEstimate(fullHistory);
        long totalQuestions = fullHistory.size();
        long passed = fullHistory.stream().filter(q -> q.score() >= 0.6).count();
        double passRate = totalQuestions > 0 ? (double) passed / totalQuestions : 0;

        Difficulty highestPassed = fullHistory.stream()
                .filter(q -> q.score() >= 0.7)
                .map(QuestionResult::difficulty)
                .max(Comparator.comparingInt(Difficulty::ordinal))
                .orElse(Difficulty.EASY);

        String level = switch (highestPassed) {
            case EXPERT -> "STAFF/PRINCIPAL";
            case HARD -> "SENIOR";
            case MEDIUM -> "MID";
            case EASY -> "JUNIOR";
        };

        return new CandidateLevel(level, ability, passRate, highestPassed, totalQuestions);
    }

    private double calculateAbilityEstimate(List<QuestionResult> history) {
        if (history.isEmpty()) return 0.5;

        double weightedScore = 0;
        double totalWeight = 0;

        for (int i = 0; i < history.size(); i++) {
            QuestionResult qr = history.get(i);
            double difficultyWeight = switch (qr.difficulty()) {
                case EASY -> 0.5;
                case MEDIUM -> 1.0;
                case HARD -> 1.5;
                case EXPERT -> 2.0;
            };
            // More recent questions weighted higher
            double recencyWeight = 1.0 + (i * 0.1);
            double weight = difficultyWeight * recencyWeight;
            weightedScore += qr.score() * weight;
            totalWeight += weight;
        }

        return totalWeight > 0 ? weightedScore / totalWeight : 0.5;
    }

    private boolean hasConsecutiveFailures(List<QuestionResult> history, int count) {
        if (history.size() < count) return false;
        return history.subList(history.size() - count, history.size()).stream().allMatch(q -> q.score() < 0.4);
    }

    private boolean hasConsecutiveSuccesses(List<QuestionResult> history, int count) {
        if (history.size() < count) return false;
        return history.subList(history.size() - count, history.size()).stream().allMatch(q -> q.score() >= 0.8);
    }

    private Difficulty reduceDifficulty(Difficulty current) {
        return switch (current) {
            case EXPERT -> Difficulty.HARD;
            case HARD -> Difficulty.MEDIUM;
            default -> Difficulty.EASY;
        };
    }

    private Difficulty increaseDifficulty(Difficulty current) {
        return switch (current) {
            case EASY -> Difficulty.MEDIUM;
            case MEDIUM -> Difficulty.HARD;
            default -> Difficulty.EXPERT;
        };
    }

    public record QuestionResult(Difficulty difficulty, double score, String competency) {}
    public record CalibrationResult(Difficulty nextDifficulty, double abilityEstimate, String reason) {}
    public record CandidateLevel(String level, double abilityScore, double passRate, Difficulty highestPassed, long totalQuestions) {}
}
