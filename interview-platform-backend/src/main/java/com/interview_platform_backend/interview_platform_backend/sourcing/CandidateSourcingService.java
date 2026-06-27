package com.interview_platform_backend.interview_platform_backend.sourcing;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * AI-Powered Candidate Sourcing Service.
 * Auto-searches LinkedIn and GitHub for candidates matching job requirements.
 * Uses job description to extract skills and find matching profiles.
 */
@Service
public class CandidateSourcingService {

    private static final Logger log = LoggerFactory.getLogger(CandidateSourcingService.class);

    @Value("${app.sourcing.github.token:}")
    private String githubToken;

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.ai.openai.model:openai/gpt-4o-mini}")
    private String model;

    private final RestClient restClient = RestClient.create();

    /**
     * Search GitHub for developers matching skill requirements.
     */
    public List<CandidateProfile> searchGitHub(List<String> skills, String location, int maxResults) {
        log.info("Sourcing: Searching GitHub for skills={}, location={}", skills, location);

        if (githubToken == null || githubToken.isBlank()) {
            log.warn("GitHub token not configured. Returning empty results.");
            return List.of();
        }

        try {
            String query = buildGitHubQuery(skills, location);
            var response = restClient.get()
                    .uri("https://api.github.com/search/users?q=" + query + "&per_page=" + maxResults)
                    .header("Authorization", "Bearer " + githubToken)
                    .header("Accept", "application/vnd.github.v3+json")
                    .retrieve().body(Map.class);

            if (response != null && response.containsKey("items")) {
                var items = (List<Map<String, Object>>) response.get("items");
                List<CandidateProfile> profiles = new ArrayList<>();
                for (var item : items) {
                    profiles.add(new CandidateProfile(
                            (String) item.get("login"),
                            (String) item.get("html_url"),
                            "GITHUB",
                            null, // Email needs separate API call
                            location,
                            skills,
                            calculateGitHubScore(item)
                    ));
                }
                log.info("GitHub sourcing found {} candidates", profiles.size());
                return profiles;
            }
            return List.of();
        } catch (Exception e) {
            log.error("GitHub sourcing failed: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Use AI to extract required skills from a job description.
     */
    public List<String> extractSkillsFromJobDescription(String jobDescription) {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            // Fallback: simple keyword extraction
            return extractKeywords(jobDescription);
        }

        try {
            var requestBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", "Extract technical skills from this job description. Return as JSON array of strings."),
                            Map.of("role", "user", "content", jobDescription)
                    ),
                    "response_format", Map.of("type", "json_object"),
                    "max_tokens", 200
            );

            var response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .header("HTTP-Referer", "https://interview-platform.app")
                    .header("X-Title", "Interview Platform AI")
                    .body(requestBody).retrieve().body(Map.class);

            if (response != null && response.containsKey("choices")) {
                var choices = (List<Map<String, Object>>) response.get("choices");
                var msg = (Map<String, Object>) choices.get(0).get("message");
                String content = (String) msg.get("content");
                // Parse JSON array from response
                var parsed = new com.fasterxml.jackson.databind.ObjectMapper().readValue(content, Map.class);
                if (parsed.containsKey("skills")) {
                    return (List<String>) parsed.get("skills");
                }
            }
        } catch (Exception e) {
            log.error("AI skill extraction failed: {}", e.getMessage());
        }
        return extractKeywords(jobDescription);
    }

    /**
     * Score and rank sourced candidates against job requirements.
     */
    public List<CandidateProfile> rankCandidates(List<CandidateProfile> candidates, List<String> requiredSkills) {
        return candidates.stream()
                .map(c -> {
                    long matchCount = c.skills() != null ? c.skills().stream().filter(requiredSkills::contains).count() : 0;
                    double matchScore = requiredSkills.isEmpty() ? 0 : (double) matchCount / requiredSkills.size();
                    return new CandidateProfile(c.name(), c.profileUrl(), c.source(), c.email(), c.location(), c.skills(), matchScore);
                })
                .sorted(Comparator.comparingDouble(CandidateProfile::relevanceScore).reversed())
                .toList();
    }

    private String buildGitHubQuery(List<String> skills, String location) {
        StringBuilder query = new StringBuilder();
        for (String skill : skills) {
            if (!query.isEmpty()) query.append("+");
            query.append(skill);
        }
        if (location != null && !location.isBlank()) {
            query.append("+location:").append(location.replace(" ", "+"));
        }
        return query.toString();
    }

    private double calculateGitHubScore(Map<String, Object> userData) {
        // Score based on available public metrics
        return 0.5 + Math.random() * 0.5; // Placeholder - would use repos, followers, contributions
    }

    private List<String> extractKeywords(String text) {
        String[] commonSkills = {"java", "python", "javascript", "react", "node", "spring", "aws", "docker",
                "kubernetes", "typescript", "go", "rust", "sql", "mongodb", "redis", "kafka"};
        String lower = text.toLowerCase();
        List<String> found = new ArrayList<>();
        for (String skill : commonSkills) {
            if (lower.contains(skill)) found.add(skill);
        }
        return found;
    }

    public record CandidateProfile(String name, String profileUrl, String source, String email, String location, List<String> skills, double relevanceScore) {}
}
