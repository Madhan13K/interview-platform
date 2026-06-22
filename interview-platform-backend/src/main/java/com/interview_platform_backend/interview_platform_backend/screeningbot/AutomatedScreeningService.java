package com.interview_platform_backend.interview_platform_backend.screeningbot;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * Automated Screening Bot Service.
 * Conducts initial screens asynchronously via text-based Q&A.
 * Uses AI to evaluate responses and provide pass/fail recommendations.
 */
@Service
public class AutomatedScreeningService {

    private static final Logger log = LoggerFactory.getLogger(AutomatedScreeningService.class);

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    private final RestClient restClient = RestClient.create();

    /**
     * Generate screening questions for a role.
     */
    public List<ScreeningQuestion> generateScreeningQuestions(String jobTitle, String requirements, int questionCount) {
        log.info("Generating {} screening questions for: {}", questionCount, jobTitle);

        if (openAiApiKey != null && !openAiApiKey.isBlank()) {
            try {
                return generateWithAI(jobTitle, requirements, questionCount);
            } catch (Exception e) {
                log.warn("AI question generation failed: {}", e.getMessage());
            }
        }

        // Fallback questions
        return List.of(
                new ScreeningQuestion("experience", "How many years of relevant experience do you have?", "NUMBER", true),
                new ScreeningQuestion("motivation", "Why are you interested in this role?", "TEXT", true),
                new ScreeningQuestion("availability", "What is your earliest available start date?", "DATE", true),
                new ScreeningQuestion("salary", "What is your expected salary range?", "TEXT", false),
                new ScreeningQuestion("location", "Are you open to the location/remote requirements for this role?", "YES_NO", true)
        ).subList(0, Math.min(questionCount, 5));
    }

    /**
     * Evaluate candidate's screening responses using AI.
     */
    public ScreeningResult evaluateResponses(String jobTitle, String requirements, List<QuestionResponse> responses) {
        log.info("Evaluating screening responses for: {}", jobTitle);

        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            return evaluateWithRules(responses);
        }

        try {
            StringBuilder context = new StringBuilder("Job: " + jobTitle + "\nRequirements: " + requirements + "\n\nCandidate Responses:\n");
            for (var qr : responses) {
                context.append("Q: ").append(qr.question()).append("\nA: ").append(qr.answer()).append("\n\n");
            }

            var requestBody = Map.of(
                    "model", "gpt-4o-mini",
                    "messages", List.of(
                            Map.of("role", "system", "content", "Evaluate this candidate's screening responses. Score 1-10 and recommend PASS/FAIL/REVIEW. Be objective. Return JSON: {\"score\": N, \"recommendation\": \"PASS|FAIL|REVIEW\", \"strengths\": [...], \"concerns\": [...], \"summary\": \"...\"}"),
                            Map.of("role", "user", "content", context.toString())
                    ),
                    "response_format", Map.of("type", "json_object"),
                    "max_tokens", 400
            );

            var response = restClient.post()
                    .uri("https://api.openai.com/v1/chat/completions")
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody).retrieve().body(Map.class);

            if (response != null && response.containsKey("choices")) {
                var choices = (List<Map<String, Object>>) response.get("choices");
                var msg = (Map<String, Object>) choices.get(0).get("message");
                var parsed = new com.fasterxml.jackson.databind.ObjectMapper().readValue((String) msg.get("content"), Map.class);

                return new ScreeningResult(
                        ((Number) parsed.getOrDefault("score", 5)).intValue(),
                        (String) parsed.getOrDefault("recommendation", "REVIEW"),
                        (List<String>) parsed.getOrDefault("strengths", List.of()),
                        (List<String>) parsed.getOrDefault("concerns", List.of()),
                        (String) parsed.getOrDefault("summary", "Evaluation complete")
                );
            }
        } catch (Exception e) {
            log.error("AI evaluation failed: {}", e.getMessage());
        }

        return evaluateWithRules(responses);
    }

    private List<ScreeningQuestion> generateWithAI(String jobTitle, String requirements, int count) throws Exception {
        var requestBody = Map.of(
                "model", "gpt-4o-mini",
                "messages", List.of(
                        Map.of("role", "system", "content", "Generate " + count + " screening questions for a job. Return JSON: {\"questions\": [{\"id\": \"q1\", \"text\": \"...\", \"type\": \"TEXT|NUMBER|YES_NO|DATE\", \"required\": true}]}"),
                        Map.of("role", "user", "content", "Job: " + jobTitle + "\nRequirements: " + requirements)
                ),
                "response_format", Map.of("type", "json_object"),
                "max_tokens", 500
        );

        var response = restClient.post().uri("https://api.openai.com/v1/chat/completions")
                .header("Authorization", "Bearer " + openAiApiKey).header("Content-Type", "application/json")
                .body(requestBody).retrieve().body(Map.class);

        var choices = (List<Map<String, Object>>) response.get("choices");
        var parsed = new com.fasterxml.jackson.databind.ObjectMapper().readValue((String) ((Map) choices.get(0).get("message")).get("content"), Map.class);
        var questions = (List<Map<String, Object>>) parsed.get("questions");

        return questions.stream().map(q -> new ScreeningQuestion(
                (String) q.get("id"), (String) q.get("text"), (String) q.getOrDefault("type", "TEXT"), Boolean.TRUE.equals(q.get("required"))
        )).toList();
    }

    private ScreeningResult evaluateWithRules(List<QuestionResponse> responses) {
        int score = 5;
        List<String> concerns = new ArrayList<>();
        for (var qr : responses) {
            if (qr.answer() == null || qr.answer().isBlank()) {
                score--;
                concerns.add("Missing answer for: " + qr.question());
            } else if (qr.answer().length() < 10) {
                concerns.add("Brief answer for: " + qr.question());
            }
        }
        String recommendation = score >= 7 ? "PASS" : score >= 4 ? "REVIEW" : "FAIL";
        return new ScreeningResult(score, recommendation, List.of(), concerns, "Rule-based evaluation");
    }

    public record ScreeningQuestion(String id, String text, String type, boolean required) {}
    public record QuestionResponse(String question, String answer) {}
    public record ScreeningResult(int score, String recommendation, List<String> strengths, List<String> concerns, String summary) {}
}
