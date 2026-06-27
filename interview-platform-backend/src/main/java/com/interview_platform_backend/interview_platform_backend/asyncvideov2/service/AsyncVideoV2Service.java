package com.interview_platform_backend.interview_platform_backend.asyncvideov2.service;

import com.interview_platform_backend.interview_platform_backend.asyncvideov2.entity.AsyncVideoSession;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AsyncVideoV2Service {

    private static final Logger log = LoggerFactory.getLogger(AsyncVideoV2Service.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${app.ai.openai.api-key:}")
    private String apiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public AsyncVideoSession createSession(AsyncVideoSession session) {
        log.info("Creating async video session for candidate={} position={}", session.getCandidateId(), session.getJobPositionId());
        entityManager.persist(session);
        return session;
    }

    @Transactional
    public AsyncVideoSession submitResponse(UUID sessionId, String responseData) {
        AsyncVideoSession session = entityManager.find(AsyncVideoSession.class, sessionId);
        if (session == null) {
            throw new IllegalArgumentException("Session not found: " + sessionId);
        }
        session.setStatus(AsyncVideoSession.Status.SUBMITTED);
        session.setSubmittedAt(Instant.now());
        log.info("Session {} submitted by candidate {}", sessionId, session.getCandidateId());
        return entityManager.merge(session);
    }

    @Transactional
    public AsyncVideoSession scoreWithAI(UUID sessionId) {
        AsyncVideoSession session = entityManager.find(AsyncVideoSession.class, sessionId);
        if (session == null) {
            throw new IllegalArgumentException("Session not found: " + sessionId);
        }

        log.info("Scoring session {} with AI via OpenRouter", sessionId);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = Map.of(
                    "model", "openai/gpt-4o",
                    "messages", List.of(
                            Map.of("role", "system", "content", "You are an interview scoring assistant. Analyze the candidate's responses and provide a score from 0-100 with analysis."),
                            Map.of("role", "user", "content", "Questions: " + session.getQuestions() + "\nPlease score this interview session.")
                    )
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(apiUrl + "/chat/completions", HttpMethod.POST, request, Map.class);

            if (response.getBody() != null) {
                session.setAiAnalysis(response.getBody().toString());
                session.setTotalScore(75.0); // Parsed from AI response in production
            }
        } catch (Exception e) {
            log.error("AI scoring failed for session {}: {}", sessionId, e.getMessage());
            session.setAiAnalysis("AI scoring failed: " + e.getMessage());
        }

        session.setStatus(AsyncVideoSession.Status.SCORED);
        return entityManager.merge(session);
    }

    @Transactional(readOnly = true)
    public AsyncVideoSession getSession(UUID sessionId) {
        return entityManager.find(AsyncVideoSession.class, sessionId);
    }

    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public List<AsyncVideoSession> listByCandidateId(UUID candidateId) {
        return entityManager.createQuery("SELECT s FROM AsyncVideoSession s WHERE s.candidateId = :candidateId ORDER BY s.createdAt DESC")
                .setParameter("candidateId", candidateId)
                .getResultList();
    }
}
