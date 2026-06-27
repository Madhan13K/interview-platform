package com.interview_platform_backend.interview_platform_backend.aiscoring;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * AI Interview Scoring Service.
 * Analyzes video interviews for:
 * - Communication clarity and confidence
 * - Engagement and enthusiasm indicators
 * - Response quality and structure
 * - Technical accuracy (via transcript analysis)
 * 
 * Note: Body language analysis requires external ML service (e.g., AWS Rekognition, Google Cloud Video AI).
 */
@Service
public class AIInterviewScoringService {

    private static final Logger log = LoggerFactory.getLogger(AIInterviewScoringService.class);

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.ai.openai.model:openai/gpt-4o-mini}")
    private String model;

    @Value("${app.ai.scoring.enabled:false}")
    private boolean scoringEnabled;

    private final RestClient restClient = RestClient.create();

    /**
     * Analyze an interview transcript and generate AI-based scores.
     */
    public InterviewScore analyzeTranscript(String transcript, String role, String interviewType) {
        if (!scoringEnabled || openAiApiKey == null || openAiApiKey.isBlank()) {
            return new InterviewScore(0, 0, 0, 0, 0, "AI scoring is disabled", Map.of());
        }

        log.info("Analyzing interview transcript for role: {} (type: {})", role, interviewType);

        try {
            String prompt = String.format("""
                Analyze this interview transcript for a %s role (%s interview).
                Score each dimension from 1-10 and provide brief justification.
                
                Respond in JSON format:
                {
                    "communication": {"score": X, "note": "..."},
                    "technical": {"score": X, "note": "..."},
                    "problemSolving": {"score": X, "note": "..."},
                    "engagement": {"score": X, "note": "..."},
                    "overall": {"score": X, "note": "..."}
                }
                
                Transcript:
                %s
                """, role, interviewType, transcript.substring(0, Math.min(transcript.length(), 3000)));

            var requestBody = Map.of(
                    "model", model,
                    "messages", java.util.List.of(
                            Map.of("role", "system", "content", "You are an expert interview evaluator. Provide objective, data-driven scoring."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "response_format", Map.of("type", "json_object"),
                    "max_tokens", 500
            );

            var response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .header("HTTP-Referer", "https://interview-platform.app")
                    .header("X-Title", "Interview Platform AI")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("choices")) {
                var choices = (java.util.List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    var msg = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) msg.get("content");
                    // Parse the JSON response (simplified)
                    var parsed = new com.fasterxml.jackson.databind.ObjectMapper().readValue(content, Map.class);
                    
                    int communication = extractScore(parsed, "communication");
                    int technical = extractScore(parsed, "technical");
                    int problemSolving = extractScore(parsed, "problemSolving");
                    int engagement = extractScore(parsed, "engagement");
                    int overall = extractScore(parsed, "overall");

                    return new InterviewScore(communication, technical, problemSolving, engagement, overall, "AI analysis complete", parsed);
                }
            }

            return new InterviewScore(0, 0, 0, 0, 0, "Failed to parse AI response", Map.of());

        } catch (Exception e) {
            log.error("AI scoring failed: {}", e.getMessage());
            return new InterviewScore(0, 0, 0, 0, 0, "Error: " + e.getMessage(), Map.of());
        }
    }

    private int extractScore(Map<String, Object> parsed, String key) {
        try {
            var section = (Map<String, Object>) parsed.get(key);
            if (section != null && section.containsKey("score")) {
                return ((Number) section.get("score")).intValue();
            }
        } catch (Exception ignored) {}
        return 0;
    }

    public record InterviewScore(int communication, int technical, int problemSolving, int engagement,
                                   int overall, String summary, Map<String, Object> details) {}
}
