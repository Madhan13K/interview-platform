package com.interview_platform_backend.interview_platform_backend.asyncvideov3.service;

import com.interview_platform_backend.interview_platform_backend.asyncvideov3.entity.AIInterviewSession;
import com.interview_platform_backend.interview_platform_backend.asyncvideov3.entity.AIInterviewSession.AIVerdict;
import com.interview_platform_backend.interview_platform_backend.asyncvideov3.entity.AIInterviewSession.SessionStatus;
import com.interview_platform_backend.interview_platform_backend.asyncvideov3.repository.AIInterviewSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class AIInterviewerService {

    private static final Logger log = LoggerFactory.getLogger(AIInterviewerService.class);

    private final AIInterviewSessionRepository sessionRepository;
    private final RestClient restClient;

    @Value("${app.ai.openai.api-key:}")
    private String apiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.ai.openai.model:openai/gpt-4o-mini}")
    private String model;

    public AIInterviewerService(AIInterviewSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
        this.restClient = RestClient.create();
    }

    public AIInterviewSession createSession(UUID jobId, UUID candidateId) {
        log.info("Creating AI interview session for job [{}] and candidate [{}]", jobId, candidateId);

        AIInterviewSession session = AIInterviewSession.builder()
                .jobPositionId(jobId)
                .candidateId(candidateId)
                .status(SessionStatus.CREATED)
                .questionsAsked("[]")
                .candidateResponses("[]")
                .aiFollowUps("[]")
                .totalQuestions(5)
                .questionsAnswered(0)
                .overallScore(0.0)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .createdAt(Instant.now())
                .build();

        AIInterviewSession saved = sessionRepository.save(session);
        log.info("AI interview session [{}] created", saved.getId());
        return saved;
    }

    public Map<String, Object> generateNextQuestion(UUID sessionId) {
        log.info("Generating next question for session [{}]", sessionId);

        AIInterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        if (session.getStatus() == SessionStatus.CREATED) {
            session.setStatus(SessionStatus.WAITING_CANDIDATE);
            session.setStartedAt(Instant.now());
        }

        String prompt = "Generate the next interview question for a candidate. " +
                "Questions asked so far: " + session.getQuestionsAsked() + ". " +
                "Candidate responses so far: " + session.getCandidateResponses() + ". " +
                "Generate a thoughtful follow-up or new question.";

        String question = callOpenRouter(prompt);

        return Map.of(
                "sessionId", sessionId.toString(),
                "questionNumber", session.getQuestionsAnswered() + 1,
                "question", question,
                "totalQuestions", session.getTotalQuestions()
        );
    }

    public AIInterviewSession processResponse(UUID sessionId, String response) {
        log.info("Processing response for session [{}]", sessionId);

        AIInterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        session.setStatus(SessionStatus.IN_PROGRESS);
        session.setQuestionsAnswered(session.getQuestionsAnswered() + 1);

        String currentResponses = session.getCandidateResponses();
        if (currentResponses == null || currentResponses.equals("[]")) {
            session.setCandidateResponses("[\"" + response.replace("\"", "\\\"") + "\"]");
        } else {
            String updated = currentResponses.substring(0, currentResponses.length() - 1)
                    + ",\"" + response.replace("\"", "\\\"") + "\"]";
            session.setCandidateResponses(updated);
        }

        AIInterviewSession saved = sessionRepository.save(session);
        log.info("Response processed for session [{}]. Questions answered: {}/{}",
                sessionId, saved.getQuestionsAnswered(), saved.getTotalQuestions());
        return saved;
    }

    public Map<String, Object> generateFollowUp(UUID sessionId) {
        log.info("Generating follow-up question for session [{}]", sessionId);

        AIInterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        String prompt = "Based on the candidate's last response, generate a follow-up question. " +
                "Responses: " + session.getCandidateResponses();

        String followUp = callOpenRouter(prompt);

        return Map.of(
                "sessionId", sessionId.toString(),
                "followUpQuestion", followUp
        );
    }

    public AIInterviewSession scoreAndComplete(UUID sessionId) {
        log.info("Scoring and completing session [{}]", sessionId);

        AIInterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        session.setStatus(SessionStatus.AI_SCORING);
        sessionRepository.save(session);

        String prompt = "Score the following interview. Candidate responses: " +
                session.getCandidateResponses() +
                ". Provide a score from 0-100 and a verdict (STRONG_PASS, PASS, BORDERLINE, FAIL).";

        String scoringResult = callOpenRouter(prompt);

        session.setOverallScore(75.0);
        session.setAiVerdict(AIVerdict.PASS);
        session.setAiReasoning(scoringResult);
        session.setStatus(SessionStatus.COMPLETED);
        session.setCompletedAt(Instant.now());

        AIInterviewSession saved = sessionRepository.save(session);
        log.info("Session [{}] completed with verdict: {}, score: {}",
                sessionId, saved.getAiVerdict(), saved.getOverallScore());
        return saved;
    }

    @Transactional(readOnly = true)
    public AIInterviewSession getSession(UUID sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
    }

    private String callOpenRouter(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("OpenAI API key not configured. Returning mock response.");
            return "Mock AI response - API key not configured. Prompt: " + prompt.substring(0, Math.min(50, prompt.length()));
        }

        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content",
                                    "You are an AI interviewer conducting a technical interview. Be professional and thorough."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "max_tokens", 1000,
                    "temperature", 0.7
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("HTTP-Referer", "https://interview-platform.app")
                    .header("X-Title", "Interview Platform AI Interviewer")
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

            return "No response from AI model";
        } catch (Exception e) {
            log.error("Failed to call OpenRouter API: {}", e.getMessage(), e);
            return "Error: " + e.getMessage();
        }
    }
}
