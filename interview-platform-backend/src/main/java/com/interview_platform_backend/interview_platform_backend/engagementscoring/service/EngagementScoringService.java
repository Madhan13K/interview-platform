package com.interview_platform_backend.interview_platform_backend.engagementscoring.service;

import com.interview_platform_backend.interview_platform_backend.engagementscoring.entity.EngagementScore;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EngagementScoringService {

    private static final Logger log = LoggerFactory.getLogger(EngagementScoringService.class);

    @PersistenceContext
    private final EntityManager entityManager;

    @Transactional
    public EngagementScore calculateScore(UUID candidateId) {
        TypedQuery<EngagementScore> query = entityManager.createQuery(
                "SELECT e FROM EngagementScore e WHERE e.candidateId = :candidateId",
                EngagementScore.class);
        query.setParameter("candidateId", candidateId);

        EngagementScore score = query.getResultStream().findFirst().orElse(null);

        // Calculate individual component scores based on candidate activity
        double responseTime = calculateResponseTimeScore(candidateId);
        double portalActivity = calculatePortalActivityScore(candidateId);
        double documentCompletion = calculateDocumentCompletionScore(candidateId);
        double communication = calculateCommunicationScore(candidateId);

        // Weighted average for overall score
        double overall = (responseTime * 0.3) + (portalActivity * 0.2)
                + (documentCompletion * 0.25) + (communication * 0.25);

        if (score == null) {
            score = EngagementScore.builder()
                    .candidateId(candidateId)
                    .overallScore(overall)
                    .responseTimeScore(responseTime)
                    .portalActivityScore(portalActivity)
                    .documentCompletionScore(documentCompletion)
                    .communicationScore(communication)
                    .factors("{\"weights\":{\"responseTime\":0.3,\"portalActivity\":0.2,\"documentCompletion\":0.25,\"communication\":0.25}}")
                    .build();
            entityManager.persist(score);
        } else {
            score.setOverallScore(overall);
            score.setResponseTimeScore(responseTime);
            score.setPortalActivityScore(portalActivity);
            score.setDocumentCompletionScore(documentCompletion);
            score.setCommunicationScore(communication);
            score.setLastCalculated(Instant.now());
            entityManager.merge(score);
        }

        log.info("Calculated engagement score for candidate [{}]: {}", candidateId, overall);
        return score;
    }

    @Transactional
    public EngagementScore updateOnActivity(UUID candidateId, String activityType) {
        log.info("Updating engagement score for candidate [{}] based on activity: {}", candidateId, activityType);
        return calculateScore(candidateId);
    }

    @Transactional(readOnly = true)
    public EngagementScore getScore(UUID candidateId) {
        TypedQuery<EngagementScore> query = entityManager.createQuery(
                "SELECT e FROM EngagementScore e WHERE e.candidateId = :candidateId",
                EngagementScore.class);
        query.setParameter("candidateId", candidateId);
        return query.getResultStream().findFirst().orElse(null);
    }

    @Transactional(readOnly = true)
    public List<EngagementScore> getTopEngaged(int limit) {
        TypedQuery<EngagementScore> query = entityManager.createQuery(
                "SELECT e FROM EngagementScore e ORDER BY e.overallScore DESC",
                EngagementScore.class);
        query.setMaxResults(limit);
        return query.getResultList();
    }

    private double calculateResponseTimeScore(UUID candidateId) {
        // In production: analyze response times to messages, interview invites, etc.
        return 75.0;
    }

    private double calculatePortalActivityScore(UUID candidateId) {
        // In production: analyze login frequency, profile updates, document views
        return 60.0;
    }

    private double calculateDocumentCompletionScore(UUID candidateId) {
        // In production: check resume uploaded, assessments completed, forms filled
        return 80.0;
    }

    private double calculateCommunicationScore(UUID candidateId) {
        // In production: analyze email opens, replies, call attendance
        return 70.0;
    }
}
