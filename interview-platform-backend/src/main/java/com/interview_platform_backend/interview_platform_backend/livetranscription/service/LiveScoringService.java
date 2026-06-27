package com.interview_platform_backend.interview_platform_backend.livetranscription.service;

import com.interview_platform_backend.interview_platform_backend.livetranscription.entity.TranscriptionSegment;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LiveScoringService {

    private static final Logger log = LoggerFactory.getLogger(LiveScoringService.class);

    @Value("${app.ai.openai.api-key:}")
    private String openRouterApiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1}")
    private String openRouterApiUrl;

    private final ConcurrentHashMap<UUID, RunningAverages> sessionAverages = new ConcurrentHashMap<>();

    public Map<String, Object> scoreSegment(TranscriptionSegment segment, String jobTitle) {
        log.debug("Scoring segment #{} for session: {}", segment.getSequenceNumber(), segment.getSessionId());

        Map<String, Double> scores;

        if (hasValidApiKey()) {
            scores = scoreWithAI(segment, jobTitle);
        } else {
            scores = scoreWithKeywords(segment, jobTitle);
        }

        RunningAverages averages = sessionAverages.computeIfAbsent(
                segment.getSessionId(), k -> new RunningAverages());
        averages.update(scores);

        Map<String, Object> result = new HashMap<>();
        result.put("segmentScores", scores);
        result.put("runningAverages", averages.getAverages());
        result.put("segmentNumber", segment.getSequenceNumber());
        result.put("sessionId", segment.getSessionId());

        return result;
    }

    private boolean hasValidApiKey() {
        return openRouterApiKey != null && !openRouterApiKey.isBlank();
    }

    private Map<String, Double> scoreWithAI(TranscriptionSegment segment, String jobTitle) {
        try {
            RestClient restClient = RestClient.builder()
                    .baseUrl(openRouterApiUrl)
                    .defaultHeader("Authorization", "Bearer " + openRouterApiKey)
                    .defaultHeader("Content-Type", "application/json")
                    .build();

            String prompt = String.format(
                    "Score the following interview response for a %s position on these criteria " +
                    "(each 0.0-1.0): clarity, technical_depth, confidence, engagement. " +
                    "Return ONLY a JSON object with these four keys and numeric values.\n\n" +
                    "Response: \"%s\"",
                    jobTitle != null ? jobTitle : "general",
                    segment.getText()
            );

            Map<String, Object> requestBody = Map.of(
                    "model", "meta-llama/llama-3.1-8b-instruct:free",
                    "messages", List.of(
                            Map.of("role", "system", "content",
                                    "You are an interview scoring assistant. Return only valid JSON."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "temperature", 0.3,
                    "max_tokens", 100
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("/chat/completions")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null) {
                return parseAIScores(response);
            }
        } catch (Exception e) {
            log.warn("AI scoring failed, falling back to keyword scoring: {}", e.getMessage());
        }

        return scoreWithKeywords(segment, jobTitle);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Double> parseAIScores(Map<String, Object> response) {
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                String content = (String) message.get("content");

                content = content.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> scores = mapper.readValue(content, Map.class);

                Map<String, Double> result = new HashMap<>();
                result.put("clarity", toDouble(scores.get("clarity")));
                result.put("technical_depth", toDouble(scores.get("technical_depth")));
                result.put("confidence", toDouble(scores.get("confidence")));
                result.put("engagement", toDouble(scores.get("engagement")));
                return result;
            }
        } catch (Exception e) {
            log.warn("Failed to parse AI scores: {}", e.getMessage());
        }

        return Map.of("clarity", 0.7, "technical_depth", 0.6, "confidence", 0.7, "engagement", 0.65);
    }

    private double toDouble(Object value) {
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(String.valueOf(value));
        } catch (Exception e) {
            return 0.5;
        }
    }

    private Map<String, Double> scoreWithKeywords(TranscriptionSegment segment, String jobTitle) {
        String text = segment.getText().toLowerCase();

        double clarity = 0.5;
        double technicalDepth = 0.4;
        double confidence = 0.5;
        double engagement = 0.5;

        // Clarity indicators
        if (text.contains("specifically") || text.contains("for example") || text.contains("in particular")) {
            clarity += 0.2;
        }
        if (text.length() > 50 && text.length() < 300) {
            clarity += 0.1;
        }

        // Technical depth indicators
        String[] techKeywords = {"architecture", "microservices", "api", "database", "algorithm",
                "optimization", "scalability", "testing", "deployment", "ci/cd",
                "kubernetes", "docker", "cloud", "aws", "performance"};
        for (String keyword : techKeywords) {
            if (text.contains(keyword)) {
                technicalDepth += 0.1;
            }
        }
        technicalDepth = Math.min(technicalDepth, 1.0);

        // Confidence indicators
        if (text.contains("i led") || text.contains("i managed") || text.contains("i designed")) {
            confidence += 0.2;
        }
        if (text.contains("maybe") || text.contains("i think") || text.contains("not sure")) {
            confidence -= 0.1;
        }

        // Engagement indicators
        if (text.contains("passionate") || text.contains("excited") || text.contains("love")) {
            engagement += 0.2;
        }
        if (text.length() > 100) {
            engagement += 0.1;
        }

        Map<String, Double> scores = new HashMap<>();
        scores.put("clarity", Math.max(0.0, Math.min(1.0, clarity)));
        scores.put("technical_depth", Math.max(0.0, Math.min(1.0, technicalDepth)));
        scores.put("confidence", Math.max(0.0, Math.min(1.0, confidence)));
        scores.put("engagement", Math.max(0.0, Math.min(1.0, engagement)));

        return scores;
    }

    private static class RunningAverages {
        private double claritySum = 0;
        private double technicalDepthSum = 0;
        private double confidenceSum = 0;
        private double engagementSum = 0;
        private int count = 0;

        synchronized void update(Map<String, Double> scores) {
            claritySum += scores.getOrDefault("clarity", 0.0);
            technicalDepthSum += scores.getOrDefault("technical_depth", 0.0);
            confidenceSum += scores.getOrDefault("confidence", 0.0);
            engagementSum += scores.getOrDefault("engagement", 0.0);
            count++;
        }

        synchronized Map<String, Double> getAverages() {
            if (count == 0) {
                return Map.of("clarity", 0.0, "technical_depth", 0.0,
                        "confidence", 0.0, "engagement", 0.0);
            }
            return Map.of(
                    "clarity", claritySum / count,
                    "technical_depth", technicalDepthSum / count,
                    "confidence", confidenceSum / count,
                    "engagement", engagementSum / count
            );
        }
    }
}
