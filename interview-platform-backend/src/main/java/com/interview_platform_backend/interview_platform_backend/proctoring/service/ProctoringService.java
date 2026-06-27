package com.interview_platform_backend.interview_platform_backend.proctoring.service;

import com.interview_platform_backend.interview_platform_backend.proctoring.entity.ProctoringSession;
import com.interview_platform_backend.interview_platform_backend.proctoring.entity.ProctoringSession.ProctoringStatus;
import com.interview_platform_backend.interview_platform_backend.proctoring.repository.ProctoringSessionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class ProctoringService {

    private static final Logger log = LoggerFactory.getLogger(ProctoringService.class);

    private final ProctoringSessionRepository proctoringSessionRepository;
    private final ObjectMapper objectMapper;

    private static final double TAB_SWITCH_PENALTY = 5.0;
    private static final double FACE_VIOLATION_PENALTY = 10.0;
    private static final double SUSPICIOUS_EVENT_PENALTY = 7.0;
    private static final double FLAG_THRESHOLD = 60.0;

    public ProctoringService(ProctoringSessionRepository proctoringSessionRepository,
                             ObjectMapper objectMapper) {
        this.proctoringSessionRepository = proctoringSessionRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ProctoringSession startSession(UUID interviewId, UUID candidateId, boolean screenConsent) {
        ProctoringSession session = ProctoringSession.builder()
                .interviewId(interviewId)
                .candidateId(candidateId)
                .status(ProctoringStatus.MONITORING)
                .screenRecordingConsent(screenConsent)
                .integrityScore(100.0)
                .suspiciousEvents("[]")
                .build();

        ProctoringSession saved = proctoringSessionRepository.save(session);
        log.info("Started proctoring session {} for interview {} (candidate: {})",
                saved.getId(), interviewId, candidateId);
        return saved;
    }

    @Transactional
    public ProctoringSession reportTabSwitch(UUID sessionId) {
        ProctoringSession session = proctoringSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Proctoring session not found: " + sessionId));

        session.setTabSwitchCount(session.getTabSwitchCount() + 1);
        addSuspiciousEvent(session, "TAB_SWITCH", "Tab switch detected (count: " + session.getTabSwitchCount() + ")");

        ProctoringSession saved = proctoringSessionRepository.save(session);
        log.info("Tab switch reported for session {} (total: {})", sessionId, saved.getTabSwitchCount());
        return saved;
    }

    @Transactional
    public ProctoringSession reportFaceCountViolation(UUID sessionId, int faceCount) {
        ProctoringSession session = proctoringSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Proctoring session not found: " + sessionId));

        session.setFaceCountViolations(session.getFaceCountViolations() + 1);
        addSuspiciousEvent(session, "FACE_COUNT_VIOLATION",
                "Unexpected face count detected: " + faceCount + " (expected 1)");

        ProctoringSession saved = proctoringSessionRepository.save(session);
        log.info("Face count violation for session {} (faces: {}, total violations: {})",
                sessionId, faceCount, saved.getFaceCountViolations());
        return saved;
    }

    @Transactional
    public ProctoringSession reportSuspiciousEvent(UUID sessionId, String eventType, String details) {
        ProctoringSession session = proctoringSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Proctoring session not found: " + sessionId));

        addSuspiciousEvent(session, eventType, details);

        ProctoringSession saved = proctoringSessionRepository.save(session);
        log.info("Suspicious event reported for session {}: {} - {}", sessionId, eventType, details);
        return saved;
    }

    @Transactional
    public ProctoringSession endSession(UUID sessionId) {
        ProctoringSession session = proctoringSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Proctoring session not found: " + sessionId));

        double integrityScore = calculateIntegrityScore(session);
        session.setIntegrityScore(integrityScore);
        session.setEndedAt(Instant.now());

        if (integrityScore < FLAG_THRESHOLD) {
            session.setStatus(ProctoringStatus.FLAGGED);
            log.warn("Proctoring session {} FLAGGED with integrity score {}", sessionId, integrityScore);
        } else {
            session.setStatus(ProctoringStatus.COMPLETED);
        }

        ProctoringSession saved = proctoringSessionRepository.save(session);
        log.info("Ended proctoring session {}: integrity score = {}, status = {}",
                sessionId, integrityScore, saved.getStatus());
        return saved;
    }

    @Transactional(readOnly = true)
    public ProctoringSession getSession(UUID sessionId) {
        return proctoringSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Proctoring session not found: " + sessionId));
    }

    @Transactional(readOnly = true)
    public List<ProctoringSession> getFlaggedSessions() {
        return proctoringSessionRepository.findByStatus(ProctoringStatus.FLAGGED);
    }

    private double calculateIntegrityScore(ProctoringSession session) {
        double score = 100.0;

        score -= session.getTabSwitchCount() * TAB_SWITCH_PENALTY;
        score -= session.getFaceCountViolations() * FACE_VIOLATION_PENALTY;

        // Count suspicious events
        List<Map<String, String>> events = parseSuspiciousEvents(session.getSuspiciousEvents());
        long otherEvents = events.stream()
                .filter(e -> !e.getOrDefault("type", "").equals("TAB_SWITCH")
                        && !e.getOrDefault("type", "").equals("FACE_COUNT_VIOLATION"))
                .count();
        score -= otherEvents * SUSPICIOUS_EVENT_PENALTY;

        return Math.max(0.0, Math.min(100.0, score));
    }

    private void addSuspiciousEvent(ProctoringSession session, String type, String details) {
        List<Map<String, String>> events = parseSuspiciousEvents(session.getSuspiciousEvents());

        Map<String, String> event = new LinkedHashMap<>();
        event.put("timestamp", Instant.now().toString());
        event.put("type", type);
        event.put("details", details);
        events.add(event);

        try {
            session.setSuspiciousEvents(objectMapper.writeValueAsString(events));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize suspicious events for session {}", session.getId(), e);
        }
    }

    private List<Map<String, String>> parseSuspiciousEvents(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, String>>>() {});
        } catch (JsonProcessingException e) {
            log.error("Failed to parse suspicious events JSON", e);
            return new ArrayList<>();
        }
    }
}
