package com.interview_platform_backend.interview_platform_backend.referencecheck.service;

import com.interview_platform_backend.interview_platform_backend.referencecheck.entity.ReferenceCheck;
import com.interview_platform_backend.interview_platform_backend.referencecheck.entity.ReferenceCheck.ReferenceCheckStatus;
import com.interview_platform_backend.interview_platform_backend.referencecheck.repository.ReferenceCheckRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ReferenceCheckService {

    private static final Logger log = LoggerFactory.getLogger(ReferenceCheckService.class);

    private final ReferenceCheckRepository referenceCheckRepository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.ai.openai.model:openai/gpt-4o-mini}")
    private String model;

    public ReferenceCheckService(ReferenceCheckRepository referenceCheckRepository, ObjectMapper objectMapper) {
        this.referenceCheckRepository = referenceCheckRepository;
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ReferenceCheck createCheck(UUID candidateId, String name, String email, String relationship) {
        ReferenceCheck check = ReferenceCheck.builder()
                .candidateId(candidateId)
                .referenceName(name)
                .referenceEmail(email)
                .relationship(relationship)
                .status(ReferenceCheckStatus.PENDING)
                .expiresAt(Instant.now().plus(14, ChronoUnit.DAYS))
                .build();

        ReferenceCheck saved = referenceCheckRepository.save(check);
        log.info("Created reference check {} for candidate {}", saved.getId(), candidateId);
        return saved;
    }

    @Transactional
    public ReferenceCheck sendQuestionnaire(UUID checkId) {
        ReferenceCheck check = referenceCheckRepository.findById(checkId)
                .orElseThrow(() -> new IllegalArgumentException("Reference check not found: " + checkId));

        String questions = generateQuestionsViaAI(check.getRelationship());
        check.setQuestionnaire(questions);
        check.setStatus(ReferenceCheckStatus.SENT);
        check.setSentAt(Instant.now());

        ReferenceCheck saved = referenceCheckRepository.save(check);
        log.info("Sent questionnaire for reference check {}", checkId);
        return saved;
    }

    @Transactional
    public ReferenceCheck processResponse(UUID checkId, Map<String, String> answers) {
        ReferenceCheck check = referenceCheckRepository.findById(checkId)
                .orElseThrow(() -> new IllegalArgumentException("Reference check not found: " + checkId));

        try {
            List<Map<String, String>> qaList = new ArrayList<>();
            for (Map.Entry<String, String> entry : answers.entrySet()) {
                Map<String, String> qa = new LinkedHashMap<>();
                qa.put("question", entry.getKey());
                qa.put("answer", entry.getValue());
                qaList.add(qa);
            }
            check.setQuestionnaire(objectMapper.writeValueAsString(qaList));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize answers for check {}", checkId, e);
        }

        check.setStatus(ReferenceCheckStatus.COMPLETED);
        check.setCompletedAt(Instant.now());

        // Calculate average rating from answers (simplified)
        check.setOverallRating(calculateRating(answers));

        ReferenceCheck saved = referenceCheckRepository.save(check);
        log.info("Processed response for reference check {}", checkId);
        return saved;
    }

    @Transactional
    public ReferenceCheck generateAISummary(UUID checkId) {
        ReferenceCheck check = referenceCheckRepository.findById(checkId)
                .orElseThrow(() -> new IllegalArgumentException("Reference check not found: " + checkId));

        String summary = callAIForSummary(check);
        check.setAiSummary(summary);

        ReferenceCheck saved = referenceCheckRepository.save(check);
        log.info("Generated AI summary for reference check {}", checkId);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<ReferenceCheck> getChecksForCandidate(UUID candidateId) {
        return referenceCheckRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCompletionRate() {
        long total = referenceCheckRepository.count();
        long completed = referenceCheckRepository.countByStatus(ReferenceCheckStatus.COMPLETED);
        double rate = total > 0 ? (double) completed / total * 100.0 : 0.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalChecks", total);
        result.put("completedChecks", completed);
        result.put("completionRate", rate);
        return result;
    }

    private String generateQuestionsViaAI(String relationship) {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            log.warn("OpenAI API key not configured. Returning default questions.");
            return getDefaultQuestions(relationship);
        }

        try {
            String prompt = "Generate 5 professional reference check questions for a " + relationship
                    + " reference. Return as JSON array of objects with 'question' field.";

            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", "You are a professional HR reference checker. Generate insightful questions."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "max_tokens", 500,
                    "temperature", 0.7
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("AI question generation failed: {}", e.getMessage());
        }

        return getDefaultQuestions(relationship);
    }

    private String callAIForSummary(ReferenceCheck check) {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            return "Reference check completed for " + check.getReferenceName()
                    + ". Overall rating: " + check.getOverallRating() + "/5.";
        }

        try {
            String prompt = "Summarize this reference check response: " + check.getQuestionnaire();

            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", "You are an HR analyst. Provide concise reference summaries."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "max_tokens", 300,
                    "temperature", 0.5
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("AI summary generation failed: {}", e.getMessage());
        }

        return "Reference check completed for " + check.getReferenceName()
                + ". Overall rating: " + check.getOverallRating() + "/5.";
    }

    private int calculateRating(Map<String, String> answers) {
        // Simplified rating calculation
        return Math.min(5, Math.max(1, answers.size()));
    }

    private String getDefaultQuestions(String relationship) {
        return "[{\"question\":\"How long did you work with this candidate?\"},{\"question\":\"What were their key strengths?\"},"
                + "{\"question\":\"What areas could they improve in?\"},{\"question\":\"Would you hire them again?\"},"
                + "{\"question\":\"How would you rate their overall performance (1-5)?\"}]";
    }
}
