package com.interview_platform_backend.interview_platform_backend.sentiment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * Real-time Sentiment Analysis Service.
 * Detects candidate engagement, confidence, and emotional state from text.
 * Uses pattern-based analysis with optional OpenAI enhancement.
 */
@Service
public class SentimentAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(SentimentAnalysisService.class);

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    private final RestClient restClient = RestClient.create();

    private static final Set<String> POSITIVE_INDICATORS = Set.of("excited", "passionate", "love", "enjoy", "thrilled", "proud", "accomplished", "eager", "enthusiastic", "great");
    private static final Set<String> NEGATIVE_INDICATORS = Set.of("frustrated", "difficult", "struggle", "unfortunately", "confused", "worried", "unsure", "failed", "problem", "issue");
    private static final Set<String> CONFIDENCE_INDICATORS = Set.of("definitely", "certainly", "absolutely", "clearly", "of course", "without doubt", "i believe", "i know");
    private static final Set<String> HESITATION_INDICATORS = Set.of("maybe", "i think", "perhaps", "not sure", "kind of", "sort of", "i guess", "um", "uh");

    public SentimentResult analyzeSentiment(String text) {
        if (text == null || text.isBlank()) return new SentimentResult(0.5, 0.5, "NEUTRAL", Map.of());

        String lower = text.toLowerCase();
        String[] words = lower.split("\\s+");

        // Calculate scores
        long positiveCount = Arrays.stream(words).filter(POSITIVE_INDICATORS::contains).count();
        long negativeCount = Arrays.stream(words).filter(NEGATIVE_INDICATORS::contains).count();
        long confidenceCount = CONFIDENCE_INDICATORS.stream().filter(lower::contains).count();
        long hesitationCount = HESITATION_INDICATORS.stream().filter(lower::contains).count();

        double sentimentScore = words.length > 0 ? 0.5 + ((double)(positiveCount - negativeCount) / words.length * 5) : 0.5;
        sentimentScore = Math.max(0, Math.min(1, sentimentScore));

        double engagementScore = calculateEngagement(text);

        String label = sentimentScore > 0.65 ? "POSITIVE" : sentimentScore < 0.35 ? "NEGATIVE" : "NEUTRAL";

        Map<String, Object> details = Map.of(
                "positiveWords", positiveCount, "negativeWords", negativeCount,
                "confidenceIndicators", confidenceCount, "hesitationIndicators", hesitationCount,
                "averageResponseLength", text.length(), "wordCount", words.length
        );

        return new SentimentResult(sentimentScore, engagementScore, label, details);
    }

    /**
     * Analyze sentiment trend over multiple messages.
     */
    public SentimentTrend analyzeTrend(List<String> messages) {
        if (messages.isEmpty()) return new SentimentTrend(List.of(), 0.5, "STABLE");

        List<Double> scores = messages.stream().map(m -> analyzeSentiment(m).sentimentScore()).toList();

        double average = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0.5);
        double firstHalf = scores.subList(0, scores.size() / 2).stream().mapToDouble(Double::doubleValue).average().orElse(0.5);
        double secondHalf = scores.subList(scores.size() / 2, scores.size()).stream().mapToDouble(Double::doubleValue).average().orElse(0.5);

        String trend = secondHalf > firstHalf + 0.1 ? "IMPROVING" : secondHalf < firstHalf - 0.1 ? "DECLINING" : "STABLE";

        return new SentimentTrend(scores, average, trend);
    }

    private double calculateEngagement(String text) {
        // Engagement indicators: response length, specificity, examples
        double lengthScore = Math.min(1.0, text.length() / 500.0);
        boolean hasExamples = text.toLowerCase().contains("for example") || text.toLowerCase().contains("specifically") || text.toLowerCase().contains("instance");
        boolean hasNumbers = text.matches(".*\\d+.*");
        return (lengthScore * 0.5) + (hasExamples ? 0.3 : 0) + (hasNumbers ? 0.2 : 0);
    }

    public record SentimentResult(double sentimentScore, double engagementScore, String label, Map<String, Object> details) {}
    public record SentimentTrend(List<Double> scores, double averageScore, String trend) {}
}
