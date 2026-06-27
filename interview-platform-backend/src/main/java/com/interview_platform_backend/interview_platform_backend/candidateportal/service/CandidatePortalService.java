package com.interview_platform_backend.interview_platform_backend.candidateportal.service;

import com.interview_platform_backend.interview_platform_backend.candidateportal.dto.CandidatePortalData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;

@Service
public class CandidatePortalService {

    private static final Logger log = LoggerFactory.getLogger(CandidatePortalService.class);

    @Value("${openrouter.api.key:}")
    private String openRouterApiKey;

    @Value("${openrouter.api.url:https://openrouter.ai/api/v1/chat/completions}")
    private String openRouterUrl;

    private final RestTemplate restTemplate;

    public CandidatePortalService() {
        this.restTemplate = new RestTemplate();
    }

    public CandidatePortalData getPortalData(UUID candidateId) {
        log.info("Fetching portal data for candidate: {}", candidateId);

        // Aggregate candidate data from various sources
        List<Map<String, Object>> upcomingInterviews = getUpcomingInterviews(candidateId);
        int completedCount = getCompletedInterviewCount(candidateId);
        List<String> pendingActions = getPendingActions(candidateId);
        int progress = calculateProgress(completedCount, upcomingInterviews.size());

        return CandidatePortalData.builder()
                .candidateId(candidateId)
                .applicationStatus(determineStatus(completedCount, upcomingInterviews.size()))
                .upcomingInterviews(upcomingInterviews)
                .completedInterviews(completedCount)
                .pendingActions(pendingActions)
                .aiPrepTips(List.of(
                        "Research the company's recent achievements and culture",
                        "Prepare STAR method examples for behavioral questions",
                        "Review the job description and align your experience"
                ))
                .progressPercent(progress)
                .nextStep(determineNextStep(upcomingInterviews, pendingActions))
                .build();
    }

    public List<String> getAIPrepTips(UUID candidateId, UUID jobId) {
        log.info("Generating AI prep tips for candidate: {}, job: {}", candidateId, jobId);

        if (openRouterApiKey == null || openRouterApiKey.isBlank()) {
            log.warn("OpenRouter API key not configured, returning default tips");
            return getDefaultPrepTips();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openRouterApiKey);

            Map<String, Object> requestBody = Map.of(
                    "model", "openai/gpt-4o-mini",
                    "messages", List.of(
                            Map.of("role", "system", "content",
                                    "You are an interview preparation coach. Provide 5 concise, actionable tips."),
                            Map.of("role", "user", "content",
                                    "Give me 5 preparation tips for a technical interview at a software company. " +
                                            "Job ID: " + jobId + ". Be specific and actionable.")
                    ),
                    "max_tokens", 500
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(openRouterUrl, request, Map.class);

            if (response != null && response.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) message.get("content");
                    return Arrays.asList(content.split("\n")).stream()
                            .filter(s -> !s.isBlank())
                            .limit(5)
                            .toList();
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch AI prep tips from OpenRouter: {}", e.getMessage());
        }

        return getDefaultPrepTips();
    }

    public List<Map<String, Object>> getInterviewTimeline(UUID candidateId) {
        log.info("Fetching interview timeline for candidate: {}", candidateId);

        // In production, this would query the interview database
        List<Map<String, Object>> timeline = new ArrayList<>();

        timeline.add(Map.of(
                "event", "Application Submitted",
                "timestamp", Instant.now().minusSeconds(86400 * 7).toString(),
                "status", "completed",
                "details", "Application received and acknowledged"
        ));

        timeline.add(Map.of(
                "event", "Resume Screening",
                "timestamp", Instant.now().minusSeconds(86400 * 5).toString(),
                "status", "completed",
                "details", "Resume passed initial screening"
        ));

        timeline.add(Map.of(
                "event", "Technical Phone Screen",
                "timestamp", Instant.now().minusSeconds(86400 * 2).toString(),
                "status", "completed",
                "details", "30-minute technical discussion"
        ));

        timeline.add(Map.of(
                "event", "Coding Assessment",
                "timestamp", Instant.now().plusSeconds(86400).toString(),
                "status", "upcoming",
                "details", "Live coding interview - 60 minutes"
        ));

        timeline.add(Map.of(
                "event", "Final Panel Interview",
                "timestamp", Instant.now().plusSeconds(86400 * 5).toString(),
                "status", "scheduled",
                "details", "Panel interview with engineering team"
        ));

        return timeline;
    }

    private List<Map<String, Object>> getUpcomingInterviews(UUID candidateId) {
        // In production, query from interview scheduling service
        return List.of(
                Map.of(
                        "id", UUID.randomUUID().toString(),
                        "type", "Technical",
                        "scheduledAt", Instant.now().plusSeconds(86400).toString(),
                        "duration", 60,
                        "interviewerName", "Engineering Team"
                )
        );
    }

    private int getCompletedInterviewCount(UUID candidateId) {
        // In production, query from interview records
        return 2;
    }

    private List<String> getPendingActions(UUID candidateId) {
        return List.of(
                "Complete coding assessment pre-work",
                "Upload portfolio link",
                "Confirm interview availability"
        );
    }

    private int calculateProgress(int completed, int upcoming) {
        int total = completed + upcoming;
        if (total == 0) return 0;
        return (int) ((completed / (double) total) * 100);
    }

    private String determineStatus(int completed, int upcoming) {
        if (upcoming == 0 && completed > 0) return "COMPLETED";
        if (completed == 0) return "APPLIED";
        return "IN_PROGRESS";
    }

    private String determineNextStep(List<Map<String, Object>> upcoming, List<String> pendingActions) {
        if (!pendingActions.isEmpty()) return pendingActions.get(0);
        if (!upcoming.isEmpty()) return "Prepare for upcoming interview";
        return "Await decision from hiring team";
    }

    private List<String> getDefaultPrepTips() {
        return List.of(
                "Research the company's products, culture, and recent news",
                "Practice coding problems on a whiteboard or shared editor",
                "Prepare 3-5 STAR method stories for behavioral questions",
                "Review system design fundamentals and common patterns",
                "Prepare thoughtful questions to ask your interviewers"
        );
    }
}
