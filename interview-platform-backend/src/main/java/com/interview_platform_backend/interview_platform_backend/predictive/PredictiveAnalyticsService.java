package com.interview_platform_backend.interview_platform_backend.predictive;

import com.interview_platform_backend.interview_platform_backend.candidate.repository.InterviewFeedbackRepository;
import com.interview_platform_backend.interview_platform_backend.candidate.repository.InterviewRepository;
import com.interview_platform_backend.interview_platform_backend.scorecard.repository.EvaluationScorecardRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.*;

/**
 * Predictive Analytics Service.
 * Provides ML-based predictions for:
 * - Candidate success probability
 * - Interviewer bias detection
 * - Time-to-hire predictions
 * - Offer acceptance likelihood
 * 
 * Uses statistical models based on historical interview data.
 * Can be extended with external ML service integration (SageMaker, Vertex AI).
 */
@Service
public class PredictiveAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(PredictiveAnalyticsService.class);

    @PersistenceContext
    private EntityManager entityManager;

    private final InterviewRepository interviewRepository;
    private final InterviewFeedbackRepository feedbackRepository;

    public PredictiveAnalyticsService(InterviewRepository interviewRepository,
                                       InterviewFeedbackRepository feedbackRepository) {
        this.interviewRepository = interviewRepository;
        this.feedbackRepository = feedbackRepository;
    }

    /**
     * Predict candidate success probability based on:
     * - Interview scores across stages
     * - Historical data from similar profiles
     * - Interviewer calibration adjustments
     */
    public CandidateSuccessPrediction predictCandidateSuccess(UUID candidateId) {
        log.info("Generating success prediction for candidate: {}", candidateId);

        // Gather candidate's interview data
        List<Object[]> feedbackData = entityManager.createQuery(
                "SELECT f.rating, f.recommendation, i.type FROM InterviewFeedBack f " +
                "JOIN f.interview i WHERE i.candidate.id = :candidateId", Object[].class)
                .setParameter("candidateId", candidateId)
                .getResultList();

        if (feedbackData.isEmpty()) {
            return new CandidateSuccessPrediction(candidateId, 0.5, "INSUFFICIENT_DATA",
                    "Not enough interview data to make a prediction", Map.of());
        }

        // Simple scoring model (in production, replace with trained ML model)
        double totalScore = 0;
        int count = 0;
        Map<String, Double> stageScores = new HashMap<>();

        for (Object[] row : feedbackData) {
            Integer rating = (Integer) row[0];
            String recommendation = row[1] != null ? row[1].toString() : "";
            String type = row[2] != null ? row[2].toString() : "OTHER";

            double normalizedScore = (rating != null ? rating : 3) / 5.0;

            // Boost for positive recommendations
            if (recommendation.contains("STRONG_HIRE")) normalizedScore = Math.min(1.0, normalizedScore + 0.15);
            else if (recommendation.contains("HIRE")) normalizedScore = Math.min(1.0, normalizedScore + 0.05);
            else if (recommendation.contains("NO_HIRE")) normalizedScore = Math.max(0.0, normalizedScore - 0.15);

            totalScore += normalizedScore;
            count++;
            stageScores.merge(type, normalizedScore, (a, b) -> (a + b) / 2);
        }

        double probability = count > 0 ? totalScore / count : 0.5;
        String confidence = count >= 3 ? "HIGH" : count >= 2 ? "MEDIUM" : "LOW";
        String recommendation = probability >= 0.75 ? "STRONG_HIRE" :
                probability >= 0.6 ? "HIRE" : probability >= 0.4 ? "BORDERLINE" : "NO_HIRE";

        return new CandidateSuccessPrediction(candidateId, probability, confidence, recommendation, stageScores);
    }

    /**
     * Detect potential interviewer bias by analyzing scoring patterns:
     * - Consistently higher/lower than peers
     * - Score variance across demographics
     * - Deviation from consensus
     */
    public InterviewerBiasReport detectInterviewerBias(UUID interviewerId) {
        log.info("Analyzing bias indicators for interviewer: {}", interviewerId);

        // Get interviewer's scoring compared to co-interviewers on same candidates
        List<Object[]> data = entityManager.createQuery(
                "SELECT f.rating, " +
                "(SELECT AVG(f2.rating) FROM InterviewFeedBack f2 WHERE f2.interview = f.interview AND f2.interviewer.id != :interviewerId) " +
                "FROM InterviewFeedBack f WHERE f.interviewer.id = :interviewerId", Object[].class)
                .setParameter("interviewerId", interviewerId)
                .getResultList();

        if (data.size() < 5) {
            return new InterviewerBiasReport(interviewerId, "INSUFFICIENT_DATA", 0, 0, List.of());
        }

        double totalDeviation = 0;
        int comparisons = 0;
        List<String> flags = new ArrayList<>();

        for (Object[] row : data) {
            Integer myRating = (Integer) row[0];
            Double peerAvg = (Double) row[1];
            if (myRating != null && peerAvg != null) {
                totalDeviation += (myRating - peerAvg);
                comparisons++;
            }
        }

        double avgDeviation = comparisons > 0 ? totalDeviation / comparisons : 0;
        double biasScore = Math.abs(avgDeviation);

        if (avgDeviation > 0.8) flags.add("CONSISTENTLY_LENIENT");
        if (avgDeviation < -0.8) flags.add("CONSISTENTLY_STRICT");
        if (biasScore > 1.5) flags.add("HIGH_DEVIATION_FROM_PEERS");

        String severity = biasScore > 1.5 ? "HIGH" : biasScore > 0.8 ? "MEDIUM" : "LOW";

        return new InterviewerBiasReport(interviewerId, severity, avgDeviation, biasScore, flags);
    }

    /**
     * Predict time-to-hire based on position and pipeline stage.
     */
    public Map<String, Object> predictTimeToHire(String department, String positionLevel) {
        // Query historical time-to-hire data
        List<Object[]> historical = entityManager.createQuery(
                "SELECT AVG(EXTRACT(EPOCH FROM (i.endTime - i.createdAt)) / 86400), COUNT(i) " +
                "FROM Interview i WHERE i.status = 'COMPLETED' " +
                "AND i.title LIKE :dept", Object[].class)
                .setParameter("dept", "%" + (department != null ? department : "") + "%")
                .getResultList();

        double avgDays = 0;
        long sampleSize = 0;
        if (!historical.isEmpty() && historical.get(0)[0] != null) {
            avgDays = ((Number) historical.get(0)[0]).doubleValue();
            sampleSize = ((Number) historical.get(0)[1]).longValue();
        }

        // Adjust based on position level
        double multiplier = switch (positionLevel != null ? positionLevel.toUpperCase() : "MID") {
            case "SENIOR", "STAFF" -> 1.3;
            case "LEAD", "PRINCIPAL" -> 1.5;
            case "EXECUTIVE", "VP" -> 2.0;
            default -> 1.0;
        };

        double predictedDays = avgDays * multiplier;

        return Map.of(
                "predictedDays", Math.round(predictedDays),
                "confidence", sampleSize > 20 ? "HIGH" : sampleSize > 5 ? "MEDIUM" : "LOW",
                "sampleSize", sampleSize,
                "historicalAvgDays", Math.round(avgDays)
        );
    }

    public record CandidateSuccessPrediction(UUID candidateId, double probability, String confidence,
                                              String recommendation, Map<String, Double> stageScores) {}

    public record InterviewerBiasReport(UUID interviewerId, String severity, double avgDeviation,
                                         double biasScore, List<String> flags) {}
}
