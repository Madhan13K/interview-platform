package com.interview_platform_backend.interview_platform_backend.aicopilot.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview_platform_backend.interview_platform_backend.aicopilot.dto.CopilotDashboard;
import com.interview_platform_backend.interview_platform_backend.aicopilot.dto.CopilotSuggestion;
import com.interview_platform_backend.interview_platform_backend.aicopilot.dto.CopilotSuggestion.SuggestionPriority;
import com.interview_platform_backend.interview_platform_backend.aicopilot.dto.CopilotSuggestion.SuggestionType;
import com.interview_platform_backend.interview_platform_backend.aicopilot.entity.CopilotSession;
import com.interview_platform_backend.interview_platform_backend.aicopilot.entity.CopilotSession.CopilotStatus;
import com.interview_platform_backend.interview_platform_backend.aicopilot.repository.CopilotSessionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AICopilotV2Service {

    private static final Logger log = LoggerFactory.getLogger(AICopilotV2Service.class);

    private final CopilotSessionRepository sessionRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.openai.api-key:}")
    private String openRouterApiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1}")
    private String openRouterApiUrl;

    private final ConcurrentHashMap<UUID, SessionState> sessionStates = new ConcurrentHashMap<>();

    private static final String[] BIAS_PATTERNS = {
            "where are you from", "how old are you", "are you married",
            "do you have children", "what religion", "political",
            "you don't look like", "for someone your age", "culture fit"
    };

    @Transactional
    public CopilotSession startCopilotSession(UUID interviewId, UUID interviewerId,
                                               List<String> competencies, int totalMinutes) {
        log.info("Starting copilot session for interview: {}, interviewer: {}", interviewId, interviewerId);

        String competenciesJson = serializeList(competencies);

        CopilotSession session = CopilotSession.builder()
                .interviewId(interviewId)
                .interviewerId(interviewerId)
                .status(CopilotStatus.ACTIVE)
                .competenciesCovered("[]")
                .competenciesRemaining(competenciesJson)
                .startedAt(Instant.now())
                .build();

        CopilotSession saved = sessionRepository.save(session);

        SessionState state = new SessionState();
        state.competencies = new ArrayList<>(competencies);
        state.coveredCompetencies = new HashSet<>();
        state.totalMinutes = totalMinutes;
        state.suggestions = new ArrayList<>();
        state.biasAlerts = new ArrayList<>();
        state.scores = new HashMap<>(Map.of(
                "clarity", 0.0, "technical_depth", 0.0,
                "confidence", 0.0, "engagement", 0.0
        ));
        sessionStates.put(saved.getId(), state);

        log.info("Copilot session started: {} with {} competencies, {} min",
                saved.getId(), competencies.size(), totalMinutes);
        return saved;
    }

    @Transactional
    public List<CopilotSuggestion> processTranscriptUpdate(UUID sessionId, String newText, int elapsedMinutes) {
        CopilotSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Copilot session not found: " + sessionId));

        SessionState state = sessionStates.computeIfAbsent(sessionId, k -> new SessionState());
        List<CopilotSuggestion> suggestions = new ArrayList<>();

        // 1. Bias detection
        List<CopilotSuggestion> biasResults = detectBias(newText);
        suggestions.addAll(biasResults);
        state.biasAlerts.addAll(biasResults.stream().map(CopilotSuggestion::getContent).toList());

        // 2. Competency tracking
        CopilotSuggestion competencyGap = trackCompetencies(state, newText, elapsedMinutes);
        if (competencyGap != null) {
            suggestions.add(competencyGap);
        }

        // 3. Time management
        CopilotSuggestion timeWarning = checkTimeManagement(state, elapsedMinutes);
        if (timeWarning != null) {
            suggestions.add(timeWarning);
        }

        // 4. AI-powered follow-up suggestions
        CopilotSuggestion followUp = generateFollowUp(newText, state);
        if (followUp != null) {
            suggestions.add(followUp);
        }

        // Update session state
        state.suggestions.addAll(suggestions);
        session.setSuggestionsGenerated(session.getSuggestionsGenerated() + suggestions.size());
        session.setBiasAlertsTriggered(session.getBiasAlertsTriggered() + biasResults.size());
        session.setCompetenciesCovered(serializeList(new ArrayList<>(state.coveredCompetencies)));
        session.setCompetenciesRemaining(serializeList(
                state.competencies.stream()
                        .filter(c -> !state.coveredCompetencies.contains(c))
                        .toList()
        ));

        sessionRepository.save(session);

        return suggestions;
    }

    @Transactional(readOnly = true)
    public CopilotDashboard getDashboard(UUID sessionId) {
        CopilotSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Copilot session not found: " + sessionId));

        SessionState state = sessionStates.computeIfAbsent(sessionId, k -> new SessionState());

        int elapsedMin = 0;
        if (session.getStartedAt() != null) {
            elapsedMin = (int) Duration.between(session.getStartedAt(), Instant.now()).toMinutes();
        }
        int remainingMin = Math.max(0, state.totalMinutes - elapsedMin);
        double progress = state.totalMinutes > 0
                ? Math.min(100.0, (elapsedMin * 100.0) / state.totalMinutes) : 0.0;

        Map<String, Boolean> competencyCoverage = new LinkedHashMap<>();
        for (String comp : state.competencies) {
            competencyCoverage.put(comp, state.coveredCompetencies.contains(comp));
        }

        String nextTopic = state.competencies.stream()
                .filter(c -> !state.coveredCompetencies.contains(c))
                .findFirst()
                .orElse("All competencies covered");

        List<CopilotSuggestion> recentSuggestions = state.suggestions.size() > 5
                ? state.suggestions.subList(state.suggestions.size() - 5, state.suggestions.size())
                : new ArrayList<>(state.suggestions);

        return CopilotDashboard.builder()
                .sessionId(sessionId)
                .interviewProgress(progress)
                .timeElapsedMin(elapsedMin)
                .timeRemainingMin(remainingMin)
                .currentScores(new HashMap<>(state.scores))
                .recentSuggestions(recentSuggestions)
                .competencyCoverage(competencyCoverage)
                .biasAlerts(new ArrayList<>(state.biasAlerts))
                .nextRecommendedTopic(nextTopic)
                .build();
    }

    @Transactional
    public CopilotSession endSession(UUID sessionId) {
        CopilotSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Copilot session not found: " + sessionId));

        session.setStatus(CopilotStatus.COMPLETED);
        session.setEndedAt(Instant.now());

        SessionState state = sessionStates.get(sessionId);
        if (state != null) {
            double avgScore = state.scores.values().stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);
            session.setOverallScore(avgScore);
        }

        sessionStates.remove(sessionId);

        log.info("Copilot session ended: {} - {} suggestions generated, {} bias alerts",
                sessionId, session.getSuggestionsGenerated(), session.getBiasAlertsTriggered());

        return sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public CopilotSession getSessionByInterview(UUID interviewId) {
        return sessionRepository.findByInterviewId(interviewId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No copilot session found for interview: " + interviewId));
    }

    private List<CopilotSuggestion> detectBias(String text) {
        List<CopilotSuggestion> alerts = new ArrayList<>();
        String lowerText = text.toLowerCase();

        for (String pattern : BIAS_PATTERNS) {
            if (lowerText.contains(pattern)) {
                alerts.add(CopilotSuggestion.builder()
                        .type(SuggestionType.BIAS_ALERT)
                        .content("Potential bias detected: '" + pattern +
                                "' - Consider rephrasing to focus on job-relevant criteria.")
                        .priority(SuggestionPriority.CRITICAL)
                        .timestamp(Instant.now())
                        .metadata(Map.of("pattern", pattern, "detected_in", text))
                        .build());
            }
        }

        return alerts;
    }

    private CopilotSuggestion trackCompetencies(SessionState state, String text, int elapsedMinutes) {
        String lowerText = text.toLowerCase();

        for (String competency : state.competencies) {
            if (lowerText.contains(competency.toLowerCase()) ||
                    lowerText.contains(competency.toLowerCase().replace(" ", ""))) {
                state.coveredCompetencies.add(competency);
            }
        }

        long uncovered = state.competencies.stream()
                .filter(c -> !state.coveredCompetencies.contains(c))
                .count();

        if (uncovered > 0 && elapsedMinutes > state.totalMinutes * 0.6) {
            String nextCompetency = state.competencies.stream()
                    .filter(c -> !state.coveredCompetencies.contains(c))
                    .findFirst()
                    .orElse("");

            return CopilotSuggestion.builder()
                    .type(SuggestionType.COMPETENCY_GAP)
                    .content("Still " + uncovered + " competencies uncovered. " +
                            "Consider transitioning to: " + nextCompetency)
                    .priority(SuggestionPriority.HIGH)
                    .timestamp(Instant.now())
                    .metadata(Map.of("uncovered_count", uncovered, "next_topic", nextCompetency))
                    .build();
        }

        return null;
    }

    private CopilotSuggestion checkTimeManagement(SessionState state, int elapsedMinutes) {
        if (state.totalMinutes <= 0) {
            return null;
        }

        int remaining = state.totalMinutes - elapsedMinutes;

        if (remaining == 10) {
            return CopilotSuggestion.builder()
                    .type(SuggestionType.TIME_WARNING)
                    .content("10 minutes remaining. Consider wrapping up current topic.")
                    .priority(SuggestionPriority.MEDIUM)
                    .timestamp(Instant.now())
                    .metadata(Map.of("remaining_minutes", remaining))
                    .build();
        } else if (remaining == 5) {
            return CopilotSuggestion.builder()
                    .type(SuggestionType.TIME_WARNING)
                    .content("5 minutes remaining. Begin closing questions.")
                    .priority(SuggestionPriority.HIGH)
                    .timestamp(Instant.now())
                    .metadata(Map.of("remaining_minutes", remaining))
                    .build();
        } else if (remaining <= 0) {
            return CopilotSuggestion.builder()
                    .type(SuggestionType.TIME_WARNING)
                    .content("Interview time has exceeded the scheduled duration.")
                    .priority(SuggestionPriority.CRITICAL)
                    .timestamp(Instant.now())
                    .metadata(Map.of("remaining_minutes", remaining))
                    .build();
        }

        return null;
    }

    private CopilotSuggestion generateFollowUp(String text, SessionState state) {
        if (hasValidApiKey()) {
            return generateFollowUpWithAI(text, state);
        }
        return generateFollowUpWithRules(text, state);
    }

    private boolean hasValidApiKey() {
        return openRouterApiKey != null && !openRouterApiKey.isBlank();
    }

    private CopilotSuggestion generateFollowUpWithAI(String text, SessionState state) {
        try {
            RestClient restClient = RestClient.builder()
                    .baseUrl(openRouterApiUrl)
                    .defaultHeader("Authorization", "Bearer " + openRouterApiKey)
                    .defaultHeader("Content-Type", "application/json")
                    .build();

            String uncoveredTopics = state.competencies.stream()
                    .filter(c -> !state.coveredCompetencies.contains(c))
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("none");

            String prompt = String.format(
                    "Based on this interview response, suggest ONE follow-up question that " +
                    "probes deeper or transitions to uncovered topics (%s). " +
                    "Return only the question text, no explanation.\n\nResponse: \"%s\"",
                    uncoveredTopics, text
            );

            Map<String, Object> requestBody = Map.of(
                    "model", "meta-llama/llama-3.1-8b-instruct:free",
                    "messages", List.of(
                            Map.of("role", "system", "content",
                                    "You are an expert interview coach. Provide concise follow-up questions."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "temperature", 0.7,
                    "max_tokens", 150
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("/chat/completions")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null) {
                String suggestion = extractAIResponse(response);
                if (suggestion != null && !suggestion.isBlank()) {
                    return CopilotSuggestion.builder()
                            .type(SuggestionType.FOLLOW_UP_QUESTION)
                            .content(suggestion)
                            .priority(SuggestionPriority.MEDIUM)
                            .timestamp(Instant.now())
                            .metadata(Map.of("source", "ai", "model", "llama-3.1-8b"))
                            .build();
                }
            }
        } catch (Exception e) {
            log.warn("AI follow-up generation failed: {}", e.getMessage());
        }

        return generateFollowUpWithRules(text, state);
    }

    @SuppressWarnings("unchecked")
    private String extractAIResponse(Map<String, Object> response) {
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        } catch (Exception e) {
            log.warn("Failed to extract AI response: {}", e.getMessage());
        }
        return null;
    }

    private CopilotSuggestion generateFollowUpWithRules(String text, SessionState state) {
        String lowerText = text.toLowerCase();

        String followUp;
        if (lowerText.contains("team") || lowerText.contains("led") || lowerText.contains("managed")) {
            followUp = "Can you describe a specific conflict within the team and how you resolved it?";
        } else if (lowerText.contains("project") || lowerText.contains("built") || lowerText.contains("developed")) {
            followUp = "What was the most challenging technical decision you made on that project?";
        } else if (lowerText.contains("problem") || lowerText.contains("challenge") || lowerText.contains("issue")) {
            followUp = "How did you measure the success of your solution?";
        } else if (lowerText.contains("learn") || lowerText.contains("growth") || lowerText.contains("improve")) {
            followUp = "Can you give a concrete example of how you applied that learning?";
        } else {
            followUp = "Could you elaborate on that with a specific example from your experience?";
        }

        return CopilotSuggestion.builder()
                .type(SuggestionType.FOLLOW_UP_QUESTION)
                .content(followUp)
                .priority(SuggestionPriority.MEDIUM)
                .timestamp(Instant.now())
                .metadata(Map.of("source", "rules"))
                .build();
    }

    private String serializeList(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize list: {}", e.getMessage());
            return "[]";
        }
    }

    private static class SessionState {
        List<String> competencies = new ArrayList<>();
        Set<String> coveredCompetencies = new HashSet<>();
        int totalMinutes = 60;
        List<CopilotSuggestion> suggestions = new ArrayList<>();
        List<String> biasAlerts = new ArrayList<>();
        Map<String, Double> scores = new HashMap<>();
    }
}
