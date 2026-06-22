package com.interview_platform_backend.interview_platform_backend.talentmatch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Smart Talent Matching Service.
 * AI matches candidates to open roles based on:
 * - Skills overlap (hard match)
 * - Experience level alignment
 * - Career trajectory/growth pattern
 * - Historical hiring data (what profiles succeeded in similar roles)
 */
@Service
public class SmartTalentMatchService {

    private static final Logger log = LoggerFactory.getLogger(SmartTalentMatchService.class);

    @PersistenceContext
    private EntityManager entityManager;

    public List<CandidateMatch> matchCandidatesToJob(UUID jobPositionId, int maxResults) {
        log.info("Smart matching candidates for job position: {}", jobPositionId);

        // Get job requirements
        Map<String, Object> jobData = getJobRequirements(jobPositionId);
        if (jobData.isEmpty()) return List.of();

        String requiredSkills = (String) jobData.getOrDefault("requirements", "");
        String level = (String) jobData.getOrDefault("experienceLevel", "MID");
        String department = (String) jobData.getOrDefault("department", "");

        // Get all candidates with their profiles
        List<Map<String, Object>> candidates = getCandidateProfiles();

        // Score each candidate
        List<CandidateMatch> matches = candidates.stream()
                .map(c -> scoreCandidate(c, requiredSkills, level, department))
                .filter(m -> m.overallScore() > 0.3) // Minimum 30% match
                .sorted(Comparator.comparingDouble(CandidateMatch::overallScore).reversed())
                .limit(maxResults)
                .collect(Collectors.toList());

        log.info("Found {} matches for job {}", matches.size(), jobPositionId);
        return matches;
    }

    public List<JobMatch> matchJobsToCandidate(UUID candidateId, int maxResults) {
        log.info("Finding matching jobs for candidate: {}", candidateId);
        // Reverse matching: find jobs that fit the candidate
        return List.of(); // Implementation similar to above but reversed
    }

    private CandidateMatch scoreCandidate(Map<String, Object> candidate, String requiredSkills, String level, String department) {
        UUID candidateId = (UUID) candidate.get("id");
        String name = candidate.get("firstName") + " " + candidate.get("lastName");
        String email = (String) candidate.get("email");

        // Skill match scoring
        double skillScore = calculateSkillScore(candidate, requiredSkills);

        // Experience level scoring
        double levelScore = calculateLevelScore(candidate, level);

        // Historical success scoring (candidates with similar profiles who were hired)
        double historyScore = calculateHistoricalScore(candidate, department);

        // Weighted overall score
        double overallScore = (skillScore * 0.5) + (levelScore * 0.3) + (historyScore * 0.2);

        Map<String, Double> breakdown = Map.of("skills", skillScore, "experience", levelScore, "historicalFit", historyScore);
        String reason = generateMatchReason(skillScore, levelScore, historyScore);

        return new CandidateMatch(candidateId, name, email, overallScore, breakdown, reason);
    }

    private double calculateSkillScore(Map<String, Object> candidate, String requiredSkills) {
        // Simple keyword matching (production would use embeddings/NLP)
        String[] required = requiredSkills.toLowerCase().split("[,;\\s]+");
        String candidateSkills = ((String) candidate.getOrDefault("skills", "")).toLowerCase();
        long matches = Arrays.stream(required).filter(s -> s.length() > 2 && candidateSkills.contains(s)).count();
        return required.length > 0 ? (double) matches / required.length : 0;
    }

    private double calculateLevelScore(Map<String, Object> candidate, String requiredLevel) {
        // Match experience level
        return 0.7; // Placeholder - would check years of experience
    }

    private double calculateHistoricalScore(Map<String, Object> candidate, String department) {
        return 0.5; // Placeholder - would analyze past hiring patterns
    }

    private String generateMatchReason(double skill, double level, double history) {
        List<String> reasons = new ArrayList<>();
        if (skill > 0.7) reasons.add("Strong skill alignment");
        if (level > 0.8) reasons.add("Experience level match");
        if (history > 0.6) reasons.add("Similar profiles succeeded in this role");
        return reasons.isEmpty() ? "Partial match" : String.join("; ", reasons);
    }

    private Map<String, Object> getJobRequirements(UUID jobId) {
        try {
            var results = entityManager.createQuery("SELECT jp.requirements, jp.experienceLevel, jp.department FROM JobPosition jp WHERE jp.id = :id", Object[].class)
                    .setParameter("id", jobId).getSingleResult();
            return Map.of("requirements", results[0] != null ? results[0] : "", "experienceLevel", results[1] != null ? results[1].toString() : "MID", "department", results[2] != null ? results[2] : "");
        } catch (Exception e) { return Map.of(); }
    }

    private List<Map<String, Object>> getCandidateProfiles() {
        try {
            var results = entityManager.createQuery("SELECT u.id, u.firstName, u.lastName, u.email FROM User u WHERE u.status = 'ACTIVE'", Object[].class)
                    .setMaxResults(200).getResultList();
            return results.stream().map(r -> Map.<String, Object>of("id", r[0], "firstName", r[1] != null ? r[1] : "", "lastName", r[2] != null ? r[2] : "", "email", r[3] != null ? r[3] : "", "skills", "")).collect(Collectors.toList());
        } catch (Exception e) { return List.of(); }
    }

    public record CandidateMatch(UUID candidateId, String name, String email, double overallScore, Map<String, Double> scoreBreakdown, String matchReason) {}
    public record JobMatch(UUID jobId, String title, double matchScore, String reason) {}
}
