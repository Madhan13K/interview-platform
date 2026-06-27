package com.interview_platform_backend.interview_platform_backend.aicoach;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * AI Interview Coach Service.
 * Provides real-time coaching to interviewers during live sessions:
 * - Suggested follow-up questions based on candidate answers
 * - Time management alerts (section running long/short)
 * - Bias detection alerts (leading questions, assumption-based language)
 * - Coverage tracking (which competencies have been assessed)
 */
@Service
public class AIInterviewCoachService {

    private static final Logger log = LoggerFactory.getLogger(AIInterviewCoachService.class);

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.ai.openai.model:openai/gpt-4o-mini}")
    private String model;

    private final RestClient restClient = RestClient.create();

    /**
     * Generate real-time coaching suggestions based on interview transcript so far.
     */
    public CoachingSuggestion generateSuggestion(String recentTranscript, String jobTitle, List<String> competencies, int elapsedMinutes, int totalMinutes) {
        log.debug("AI Coach: Generating suggestion for {} interview ({}min/{}min)", jobTitle, elapsedMinutes, totalMinutes);

        List<String> suggestions = new ArrayList<>();
        List<String> biasAlerts = new ArrayList<>();
        String timeAlert = null;

        // Time management
        double progress = (double) elapsedMinutes / totalMinutes;
        if (progress > 0.8 && competencies.size() > 2) {
            timeAlert = "Only " + (totalMinutes - elapsedMinutes) + " minutes remaining. Consider wrapping up current topic.";
        } else if (progress < 0.3 && recentTranscript.length() > 2000) {
            timeAlert = "Spending significant time on first topic. Ensure time for remaining competencies.";
        }

        // Bias detection (pattern matching)
        String lower = recentTranscript.toLowerCase();
        if (lower.contains("where are you from") || lower.contains("how old are you")) {
            biasAlerts.add("Potential demographic question detected. Focus on role-relevant qualifications.");
        }
        if (lower.contains("culture fit") && !lower.contains("collaboration")) {
            biasAlerts.add("'Culture fit' language detected. Consider reframing as 'values alignment' with specific examples.");
        }
        if (lower.contains("he would") || lower.contains("she would") || lower.contains("guys")) {
            biasAlerts.add("Gendered language detected. Use gender-neutral terms.");
        }
        if (lower.contains("don't you think") || lower.contains("wouldn't you agree")) {
            biasAlerts.add("Leading question pattern detected. Rephrase as open-ended question.");
        }

        // AI-generated follow-up suggestions
        if (openAiApiKey != null && !openAiApiKey.isBlank() && recentTranscript.length() > 100) {
            try {
                suggestions = generateAIFollowUps(recentTranscript, jobTitle, competencies);
            } catch (Exception e) {
                log.warn("AI follow-up generation failed: {}", e.getMessage());
                suggestions = generateFallbackSuggestions(competencies, elapsedMinutes, totalMinutes);
            }
        } else {
            suggestions = generateFallbackSuggestions(competencies, elapsedMinutes, totalMinutes);
        }

        return new CoachingSuggestion(suggestions, biasAlerts, timeAlert, elapsedMinutes, totalMinutes);
    }

    /**
     * Track competency coverage during the interview.
     */
    public CompetencyCoverage analyzeCompetencyCoverage(String transcript, List<String> requiredCompetencies) {
        Map<String, Boolean> coverage = new LinkedHashMap<>();
        String lower = transcript.toLowerCase();

        for (String competency : requiredCompetencies) {
            boolean covered = lower.contains(competency.toLowerCase()) ||
                    containsRelatedTerms(lower, competency);
            coverage.put(competency, covered);
        }

        long coveredCount = coverage.values().stream().filter(v -> v).count();
        List<String> uncovered = coverage.entrySet().stream()
                .filter(e -> !e.getValue())
                .map(Map.Entry::getKey)
                .toList();

        return new CompetencyCoverage(coverage, (double) coveredCount / requiredCompetencies.size() * 100, uncovered);
    }

    private List<String> generateAIFollowUps(String transcript, String jobTitle, List<String> competencies) {
        var requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", "You are an interview coach. Based on the transcript, suggest 2-3 follow-up questions the interviewer should ask. Be specific and relevant. Return as JSON: {\"questions\": [...]}"),
                        Map.of("role", "user", "content", "Job: " + jobTitle + "\nCompetencies: " + String.join(", ", competencies) + "\n\nRecent transcript:\n" + transcript.substring(Math.max(0, transcript.length() - 1000)))
                ),
                "response_format", Map.of("type", "json_object"),
                "max_tokens", 300
        );

        var response = restClient.post()
                .uri(apiUrl)
                .header("Authorization", "Bearer " + openAiApiKey)
                .header("Content-Type", "application/json")
                .header("HTTP-Referer", "https://interview-platform.app")
                .header("X-Title", "Interview Platform AI")
                .body(requestBody).retrieve().body(Map.class);

        if (response != null && response.containsKey("choices")) {
            var choices = (List<Map<String, Object>>) response.get("choices");
            var msg = (Map<String, Object>) choices.get(0).get("message");
            String content = (String) msg.get("content");
            try {
                var parsed = new com.fasterxml.jackson.databind.ObjectMapper().readValue(content, Map.class);
                if (parsed.containsKey("questions")) return (List<String>) parsed.get("questions");
            } catch (Exception e) {
                log.warn("Failed to parse AI response: {}", e.getMessage());
            }
        }
        return List.of();
    }

    private List<String> generateFallbackSuggestions(List<String> competencies, int elapsed, int total) {
        List<String> suggestions = new ArrayList<>();
        if (elapsed < total / 3) suggestions.add("Consider asking about specific project examples");
        if (elapsed > total / 2) suggestions.add("Ask about challenges faced and how they were overcome");
        if (!competencies.isEmpty()) suggestions.add("Explore: " + competencies.get(0) + " — ask for a concrete example");
        return suggestions;
    }

    private boolean containsRelatedTerms(String text, String competency) {
        Map<String, List<String>> relatedTerms = Map.of(
                "leadership", List.of("lead", "managed", "team", "mentored", "directed"),
                "problem-solving", List.of("solved", "debug", "fixed", "resolved", "troubleshoot"),
                "communication", List.of("presented", "explained", "collaborated", "stakeholder"),
                "technical", List.of("implemented", "built", "designed", "architected", "coded")
        );
        List<String> terms = relatedTerms.getOrDefault(competency.toLowerCase(), List.of());
        return terms.stream().anyMatch(text::contains);
    }

    public record CoachingSuggestion(List<String> followUpQuestions, List<String> biasAlerts, String timeAlert, int elapsedMinutes, int totalMinutes) {}
    public record CompetencyCoverage(Map<String, Boolean> coverage, double coveragePercent, List<String> uncoveredCompetencies) {}
}
