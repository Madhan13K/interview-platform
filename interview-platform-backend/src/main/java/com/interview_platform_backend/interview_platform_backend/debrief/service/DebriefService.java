package com.interview_platform_backend.interview_platform_backend.debrief.service;

import com.interview_platform_backend.interview_platform_backend.debrief.entity.DebriefSession;
import com.interview_platform_backend.interview_platform_backend.debrief.entity.DebriefVote;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class DebriefService {

    private static final Logger log = LoggerFactory.getLogger(DebriefService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public DebriefSession createSession(DebriefSession session) {
        log.info("Creating debrief session for interview={}", session.getInterviewId());
        entityManager.persist(session);
        return session;
    }

    @Transactional
    public DebriefVote submitVote(DebriefVote vote) {
        log.info("Vote submitted by participant={} for session={}", vote.getParticipantId(), vote.getSessionId());
        entityManager.persist(vote);
        return vote;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public DebriefSession calibrate(UUID sessionId) {
        DebriefSession session = entityManager.find(DebriefSession.class, sessionId);
        if (session == null) {
            throw new IllegalArgumentException("Debrief session not found: " + sessionId);
        }

        List<DebriefVote> votes = entityManager.createQuery(
                        "SELECT v FROM DebriefVote v WHERE v.sessionId = :sessionId")
                .setParameter("sessionId", sessionId)
                .getResultList();

        if (votes.isEmpty()) {
            log.warn("No votes found for session {}", sessionId);
            return session;
        }

        double avgRating = votes.stream().mapToInt(DebriefVote::getRating).average().orElse(0.0);
        long hireCount = votes.stream().filter(v ->
                v.getRecommendation() == DebriefVote.Recommendation.STRONG_HIRE ||
                        v.getRecommendation() == DebriefVote.Recommendation.HIRE).count();
        long noHireCount = votes.size() - hireCount;

        boolean consensus = (double) Math.max(hireCount, noHireCount) / votes.size() >= 0.75;
        session.setConsensusReached(consensus);

        String recommendation = hireCount > noHireCount ? "HIRE" : "NO_HIRE";
        session.setFinalRecommendation(String.format("Avg Rating: %.1f | Recommendation: %s | Consensus: %s",
                avgRating, recommendation, consensus));

        session.setStatus(DebriefSession.Status.COMPLETED);
        session.setCompletedAt(Instant.now());

        log.info("Calibration complete for session {}. Consensus: {}, Recommendation: {}", sessionId, consensus, recommendation);
        return entityManager.merge(session);
    }

    @Transactional(readOnly = true)
    public DebriefSession getResults(UUID sessionId) {
        return entityManager.find(DebriefSession.class, sessionId);
    }
}
