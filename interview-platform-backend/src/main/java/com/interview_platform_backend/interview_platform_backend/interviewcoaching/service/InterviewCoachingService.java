package com.interview_platform_backend.interview_platform_backend.interviewcoaching.service;

import com.interview_platform_backend.interview_platform_backend.interviewcoaching.entity.MockInterviewSession;
import com.interview_platform_backend.interview_platform_backend.interviewcoaching.entity.MockInterviewSession.InterviewType;
import com.interview_platform_backend.interview_platform_backend.interviewcoaching.entity.MockInterviewSession.SessionStatus;
import com.interview_platform_backend.interview_platform_backend.interviewcoaching.repository.MockInterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InterviewCoachingService {

    private static final Logger log = LoggerFactory.getLogger(InterviewCoachingService.class);

    private final MockInterviewSessionRepository sessionRepository;

    @Transactional
    public MockInterviewSession startMockInterview(UUID candidateId, String jobTitle, String type) {
        log.info("Starting mock interview for candidate [{}], job: [{}], type: [{}]",
                candidateId, jobTitle, type);

        InterviewType interviewType = InterviewType.valueOf(type.toUpperCase());

        MockInterviewSession session = MockInterviewSession.builder()
                .candidateId(candidateId)
                .jobTitle(jobTitle)
                .interviewType(interviewType)
                .status(SessionStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .build();

        MockInterviewSession saved = sessionRepository.save(session);
        log.info("Mock interview session [{}] started for candidate [{}]", saved.getId(), candidateId);
        return saved;
    }

    @Transactional
    public Map<String, Object> askQuestion(UUID sessionId) {
        log.info("Generating question for session [{}]", sessionId);

        MockInterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        session.setQuestionsAsked(session.getQuestionsAsked() + 1);
        sessionRepository.save(session);

        // Placeholder for OpenRouter AI question generation
        String question = generateQuestionForType(session.getInterviewType(), session.getQuestionsAsked());

        return Map.of(
                "sessionId", sessionId,
                "questionNumber", session.getQuestionsAsked(),
                "question", question,
                "type", session.getInterviewType().name(),
                "hint", "Take your time to structure your answer"
        );
    }

    @Transactional
    public Map<String, Object> evaluateAnswer(UUID sessionId, String answer) {
        log.info("Evaluating answer for session [{}]", sessionId);

        MockInterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        // Placeholder for OpenRouter AI evaluation
        double score = evaluateAnswerContent(answer, session.getInterviewType());
        double currentAvg = session.getAvgScore();
        int questionsAnswered = session.getQuestionsAsked();
        double newAvg = ((currentAvg * (questionsAnswered - 1)) + score) / questionsAnswered;
        session.setAvgScore(newAvg);
        sessionRepository.save(session);

        return Map.of(
                "sessionId", sessionId,
                "score", score,
                "averageScore", newAvg,
                "feedback", "Good structure. Consider providing more specific examples.",
                "strengths", List.of("Clear communication", "Logical structure"),
                "improvements", List.of("Add quantifiable results", "Be more concise")
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDetailedFeedback(UUID sessionId) {
        log.info("Getting detailed feedback for session [{}]", sessionId);

        MockInterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        return Map.of(
                "sessionId", sessionId,
                "jobTitle", session.getJobTitle(),
                "interviewType", session.getInterviewType().name(),
                "questionsAsked", session.getQuestionsAsked(),
                "averageScore", session.getAvgScore(),
                "feedback", session.getFeedback() != null ? session.getFeedback() : "[]",
                "strengths", session.getStrengths() != null ? session.getStrengths() : "[]",
                "improvements", session.getImprovements() != null ? session.getImprovements() : "[]",
                "duration", session.getDuration()
        );
    }

    @Transactional
    public MockInterviewSession complete(UUID sessionId) {
        log.info("Completing mock interview session [{}]", sessionId);

        MockInterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        session.setStatus(SessionStatus.COMPLETED);
        session.setCompletedAt(Instant.now());
        if (session.getStartedAt() != null) {
            long minutes = java.time.Duration.between(session.getStartedAt(), Instant.now()).toMinutes();
            session.setDuration((int) minutes);
        }
        session.setFeedback("[{\"overall\":\"Good performance with room for improvement\"}]");
        session.setStrengths("[\"Communication\",\"Problem decomposition\"]");
        session.setImprovements("[\"Time management\",\"Edge case handling\"]");

        MockInterviewSession saved = sessionRepository.save(session);
        log.info("Session [{}] completed. Duration: {} min, Avg score: {}",
                sessionId, saved.getDuration(), saved.getAvgScore());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<MockInterviewSession> getHistory(UUID candidateId) {
        log.debug("Fetching interview history for candidate [{}]", candidateId);
        return sessionRepository.findByCandidateIdOrderByStartedAtDesc(candidateId);
    }

    private String generateQuestionForType(InterviewType type, int questionNumber) {
        return switch (type) {
            case TECHNICAL -> "Question " + questionNumber + ": Explain the time complexity of your approach and suggest optimizations.";
            case BEHAVIORAL -> "Question " + questionNumber + ": Tell me about a time you had to handle a difficult team conflict.";
            case SYSTEM_DESIGN -> "Question " + questionNumber + ": Design a distributed cache system that handles millions of requests per second.";
            case CASE_STUDY -> "Question " + questionNumber + ": How would you approach entering a new market with limited resources?";
        };
    }

    private double evaluateAnswerContent(String answer, InterviewType type) {
        if (answer == null || answer.isBlank()) return 0.0;
        int length = answer.split("\\s+").length;
        double baseScore = Math.min(8.0, length / 20.0);
        return Math.round(baseScore * 10.0) / 10.0;
    }
}
