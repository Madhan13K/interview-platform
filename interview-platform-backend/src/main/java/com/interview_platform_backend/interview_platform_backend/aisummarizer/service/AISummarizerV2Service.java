package com.interview_platform_backend.interview_platform_backend.aisummarizer.service;

import com.interview_platform_backend.interview_platform_backend.aisummarizer.entity.InterviewSummaryV2;
import com.interview_platform_backend.interview_platform_backend.aisummarizer.repository.InterviewSummaryV2Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class AISummarizerV2Service {

    private static final Logger log = LoggerFactory.getLogger(AISummarizerV2Service.class);

    private final InterviewSummaryV2Repository summaryRepository;
    private final RestClient restClient;

    @Value("${app.ai.openai.api-key:}")
    private String apiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.ai.openai.model:openai/gpt-4o-mini}")
    private String model;

    public AISummarizerV2Service(InterviewSummaryV2Repository summaryRepository) {
        this.summaryRepository = summaryRepository;
        this.restClient = RestClient.create();
    }

    public InterviewSummaryV2 generateSummary(UUID interviewId) {
        log.info("Generating AI summary for interview [{}]", interviewId);

        String prompt = "Analyze the following interview transcript and produce comprehensive meeting notes. " +
                "Include: attendees, key discussion points, action items (with assignee, task, due date), " +
                "decisions made, follow-up requirements, next steps, and overall sentiment. " +
                "Interview ID: " + interviewId;

        String aiOutput = callOpenRouter(prompt);

        InterviewSummaryV2 summary = InterviewSummaryV2.builder()
                .interviewId(interviewId)
                .generatedBy("AI")
                .attendees("[]")
                .keyDiscussionPoints(aiOutput)
                .actionItems("[]")
                .decisions("{}")
                .followUpRequired(false)
                .nextSteps("")
                .overallSentiment("NEUTRAL")
                .duration(0)
                .distributedTo("[]")
                .createdAt(Instant.now())
                .build();

        InterviewSummaryV2 saved = summaryRepository.save(summary);
        log.info("Generated summary [{}] for interview [{}]", saved.getId(), interviewId);
        return saved;
    }

    public InterviewSummaryV2 distributeSummary(UUID summaryId) {
        log.info("Distributing summary [{}] to all participants", summaryId);

        InterviewSummaryV2 summary = summaryRepository.findById(summaryId)
                .orElseThrow(() -> new RuntimeException("Summary not found: " + summaryId));

        summary.setDistributedAt(Instant.now());
        InterviewSummaryV2 saved = summaryRepository.save(summary);
        log.info("Summary [{}] distributed at [{}]", summaryId, saved.getDistributedAt());
        return saved;
    }

    @Transactional(readOnly = true)
    public InterviewSummaryV2 getSummary(UUID interviewId) {
        log.debug("Fetching summary for interview [{}]", interviewId);
        return summaryRepository.findByInterviewId(interviewId)
                .orElseThrow(() -> new RuntimeException("Summary not found for interview: " + interviewId));
    }

    private String callOpenRouter(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("OpenAI API key not configured. Returning mock summary.");
            return "{\"summary\": \"Mock summary - API key not configured\"}";
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content",
                                    "You are an AI interview summarizer. Produce structured JSON meeting notes."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "max_tokens", 2000,
                    "temperature", 0.3
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("HTTP-Referer", "https://interview-platform.app")
                    .header("X-Title", "Interview Platform AI Summarizer")
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

            return "{\"summary\": \"No response from AI model\"}";
        } catch (Exception e) {
            log.error("Failed to call OpenRouter API: {}", e.getMessage(), e);
            return "{\"summary\": \"Error generating summary: " + e.getMessage() + "\"}";
        }
    }
}
