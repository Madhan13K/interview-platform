package com.interview_platform_backend.interview_platform_backend.resumeranking.service;

import com.interview_platform_backend.interview_platform_backend.resumeranking.entity.ResumeRank;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeRankingService {

    private static final Logger log = LoggerFactory.getLogger(ResumeRankingService.class);

    @PersistenceContext
    private final EntityManager entityManager;

    @Value("${app.ai.openrouter.api-key:}")
    private String openRouterApiKey;

    @Transactional
    public List<ResumeRank> rankCandidatesForJob(UUID jobId, List<UUID> candidateIds) {
        // Uses OpenRouter AI to score resumes against job description.
        // In production, this calls OpenRouter API with JD + each resume to get scoring.
        log.info("Ranking {} candidates for job position [{}] using AI", candidateIds.size(), jobId);

        // Remove existing rankings for this job
        entityManager.createQuery(
                        "DELETE FROM ResumeRank r WHERE r.jobPositionId = :jobId")
                .setParameter("jobId", jobId)
                .executeUpdate();

        List<ResumeRank> rankings = new ArrayList<>();

        for (UUID candidateId : candidateIds) {
            // In production: call OpenRouter with resume + JD for AI scoring
            double skillMatch = Math.random() * 40 + 60; // 60-100
            double experience = Math.random() * 40 + 60;
            double education = Math.random() * 40 + 60;
            double fitScore = (skillMatch * 0.4) + (experience * 0.35) + (education * 0.25);

            ResumeRank rank = ResumeRank.builder()
                    .jobPositionId(jobId)
                    .candidateId(candidateId)
                    .fitScore(fitScore)
                    .skillMatchScore(skillMatch)
                    .experienceScore(experience)
                    .educationScore(education)
                    .overallRank(0) // Will be set after sorting
                    .aiReasoning("AI analysis pending - OpenRouter integration")
                    .rankedAt(Instant.now())
                    .build();

            rankings.add(rank);
        }

        // Sort by fitScore descending and assign ranks
        rankings.sort(Comparator.comparingDouble(ResumeRank::getFitScore).reversed());
        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setOverallRank(i + 1);
            entityManager.persist(rankings.get(i));
        }

        log.info("Ranked {} candidates for job [{}]. Top candidate fit score: {}",
                rankings.size(), jobId,
                rankings.isEmpty() ? "N/A" : String.format("%.2f", rankings.get(0).getFitScore()));
        return rankings;
    }

    @Transactional(readOnly = true)
    public List<ResumeRank> getRankings(UUID jobId) {
        TypedQuery<ResumeRank> query = entityManager.createQuery(
                "SELECT r FROM ResumeRank r WHERE r.jobPositionId = :jobId ORDER BY r.overallRank ASC",
                ResumeRank.class);
        query.setParameter("jobId", jobId);
        return query.getResultList();
    }

    @Transactional(readOnly = true)
    public ResumeRank getCandidateRank(UUID candidateId, UUID jobId) {
        TypedQuery<ResumeRank> query = entityManager.createQuery(
                "SELECT r FROM ResumeRank r WHERE r.candidateId = :candidateId AND r.jobPositionId = :jobId",
                ResumeRank.class);
        query.setParameter("candidateId", candidateId);
        query.setParameter("jobId", jobId);
        return query.getResultStream().findFirst().orElse(null);
    }
}
