package com.interview_platform_backend.interview_platform_backend.ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.*;

/**
 * Interview Question Generator v2.
 * Context-aware question generation based on:
 * - Candidate's resume/profile
 * - Job description requirements
 * - Previous round feedback (avoid repeating topics)
 * - Interview stage (technical/behavioral/system design)
 */
@Service
public class QuestionGeneratorV2Service {

    private static final Logger log = LoggerFactory.getLogger(QuestionGeneratorV2Service.class);

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.ai.openai.model:openai/gpt-4o-mini}")
    private String model;

    @PersistenceContext
    private EntityManager entityManager;

    private final RestClient restClient = RestClient.create();

    public GeneratedQuestions generateContextAwareQuestions(UUID candidateId, UUID jobPositionId, UUID interviewId, String interviewType, int count) {
        log.info("Generating context-aware questions: candidate={}, job={}, type={}", candidateId, jobPositionId, interviewType);

        String candidateContext = buildCandidateContext(candidateId);
        String jobContext = buildJobContext(jobPositionId);
        String previousFeedback = buildPreviousFeedbackContext(candidateId);

        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            return new GeneratedQuestions(getDefaultQuestions(interviewType, count), "fallback", candidateContext);
        }

        try {
            String prompt = String.format("""
                Generate %d interview questions for a %s interview.
                
                Candidate Background: %s
                Job Requirements: %s
                Previous Feedback: %s
                
                Rules:
                - Questions should probe areas NOT already covered in previous rounds
                - Tailor difficulty to candidate's experience level
                - Include follow-up prompts for each question
                - Mix behavioral and technical aspects
                
                Return JSON: {"questions": [{"question": "...", "followUp": "...", "competency": "...", "difficulty": "EASY|MEDIUM|HARD", "timeMinutes": N}]}
                """, count, interviewType, candidateContext, jobContext, previousFeedback);

            var requestBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", "You generate interview questions tailored to specific candidates and roles."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "response_format", Map.of("type", "json_object"),
                    "max_tokens", 800
            );

            var response = restClient.post().uri(apiUrl)
                    .header("Authorization", "Bearer " + openAiApiKey).header("Content-Type", "application/json")
                    .header("HTTP-Referer", "https://interview-platform.app").header("X-Title", "Interview Platform AI")
                    .body(requestBody).retrieve().body(Map.class);

            if (response != null) {
                var choices = (List<Map<String, Object>>) response.get("choices");
                var content = (String) ((Map) choices.get(0).get("message")).get("content");
                var parsed = new com.fasterxml.jackson.databind.ObjectMapper().readValue(content, Map.class);
                var questions = (List<Map<String, Object>>) parsed.get("questions");

                List<ContextQuestion> result = questions.stream().map(q -> new ContextQuestion(
                        (String) q.get("question"), (String) q.get("followUp"), (String) q.get("competency"),
                        (String) q.getOrDefault("difficulty", "MEDIUM"), ((Number) q.getOrDefault("timeMinutes", 5)).intValue()
                )).toList();

                return new GeneratedQuestions(result, "ai", candidateContext);
            }
        } catch (Exception e) {
            log.error("Context-aware question generation failed: {}", e.getMessage());
        }

        return new GeneratedQuestions(getDefaultQuestions(interviewType, count), "fallback", candidateContext);
    }

    private String buildCandidateContext(UUID candidateId) {
        try {
            var result = entityManager.createQuery("SELECT u.firstName, u.lastName FROM User u WHERE u.id = :id", Object[].class)
                    .setParameter("id", candidateId).getSingleResult();
            return result[0] + " " + result[1];
        } catch (Exception e) { return "Unknown candidate"; }
    }

    private String buildJobContext(UUID jobId) {
        try {
            var result = entityManager.createQuery("SELECT jp.title, jp.requirements FROM JobPosition jp WHERE jp.id = :id", Object[].class)
                    .setParameter("id", jobId).getSingleResult();
            return result[0] + ": " + (result[1] != null ? result[1] : "");
        } catch (Exception e) { return "General role"; }
    }

    private String buildPreviousFeedbackContext(UUID candidateId) {
        try {
            var results = entityManager.createQuery("SELECT f.strengths, f.weaknesses FROM InterviewFeedBack f WHERE f.interview.candidate.id = :id", Object[].class)
                    .setParameter("id", candidateId).setMaxResults(3).getResultList();
            if (results.isEmpty()) return "No previous feedback";
            StringBuilder sb = new StringBuilder();
            for (var r : results) {
                if (r[0] != null) sb.append("Strengths: ").append(r[0]).append(". ");
                if (r[1] != null) sb.append("Gaps: ").append(r[1]).append(". ");
            }
            return sb.toString();
        } catch (Exception e) { return "No previous feedback"; }
    }

    private List<ContextQuestion> getDefaultQuestions(String type, int count) {
        List<ContextQuestion> defaults = switch (type.toUpperCase()) {
            case "TECHNICAL" -> List.of(
                    new ContextQuestion("Walk me through the most complex system you've designed.", "What trade-offs did you make?", "System Design", "HARD", 10),
                    new ContextQuestion("How do you approach debugging a production issue?", "Give a specific example.", "Problem Solving", "MEDIUM", 8),
                    new ContextQuestion("Explain a technology choice you made that you later regretted.", "What would you do differently?", "Technical Judgment", "MEDIUM", 7)
            );
            case "BEHAVIORAL" -> List.of(
                    new ContextQuestion("Tell me about a time you disagreed with your manager.", "How did you resolve it?", "Communication", "MEDIUM", 8),
                    new ContextQuestion("Describe a project where you had to influence without authority.", "What was the outcome?", "Leadership", "MEDIUM", 8),
                    new ContextQuestion("When did you fail and what did you learn?", "How did you apply that learning?", "Growth Mindset", "EASY", 7)
            );
            default -> List.of(
                    new ContextQuestion("What interests you about this role?", "How does it fit your career goals?", "Motivation", "EASY", 5),
                    new ContextQuestion("Describe your ideal team environment.", "Give an example of when you thrived.", "Culture", "EASY", 5)
            );
        };
        return defaults.subList(0, Math.min(count, defaults.size()));
    }

    public record ContextQuestion(String question, String followUp, String competency, String difficulty, int timeMinutes) {}
    public record GeneratedQuestions(List<ContextQuestion> questions, String source, String candidateContext) {}
}
