package com.interview_platform_backend.interview_platform_backend.autoschedulingv2.service;

import com.interview_platform_backend.interview_platform_backend.autoschedulingv2.entity.AutoScheduleRequest;
import com.interview_platform_backend.interview_platform_backend.autoschedulingv2.entity.AutoScheduleRequest.AutoScheduleStatus;
import com.interview_platform_backend.interview_platform_backend.autoschedulingv2.repository.AutoScheduleRequestRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AutoSchedulingV2Service {

    private static final Logger log = LoggerFactory.getLogger(AutoSchedulingV2Service.class);

    private final AutoScheduleRequestRepository autoScheduleRequestRepository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.ai.openai.api-url:https://openrouter.ai/api/v1/chat/completions}")
    private String apiUrl;

    @Value("${app.ai.openai.model:openai/gpt-4o-mini}")
    private String model;

    public AutoSchedulingV2Service(AutoScheduleRequestRepository autoScheduleRequestRepository,
                                   ObjectMapper objectMapper) {
        this.autoScheduleRequestRepository = autoScheduleRequestRepository;
        this.restClient = RestClient.create();
        this.objectMapper = objectMapper;
    }

    @Transactional
    public AutoScheduleRequest requestAutoSchedule(UUID interviewId, UUID candidateId,
                                                   List<UUID> interviewerIds, int duration) {
        String interviewerIdsJson;
        try {
            interviewerIdsJson = objectMapper.writeValueAsString(interviewerIds);
        } catch (JsonProcessingException e) {
            interviewerIdsJson = interviewerIds.toString();
        }

        AutoScheduleRequest request = AutoScheduleRequest.builder()
                .interviewId(interviewId)
                .candidateId(candidateId)
                .interviewerIds(interviewerIdsJson)
                .durationMinutes(duration)
                .status(AutoScheduleStatus.PENDING)
                .build();

        AutoScheduleRequest saved = autoScheduleRequestRepository.save(request);
        log.info("Auto-schedule request created: {} for interview {}", saved.getId(), interviewId);
        return saved;
    }

    @Transactional
    public AutoScheduleRequest proposeSlot(UUID requestId) {
        AutoScheduleRequest request = autoScheduleRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Auto-schedule request not found: " + requestId));

        // Use AI to determine best time slot
        String reasoning = findBestTimeSlotViaAI(request);
        Instant proposedTime = Instant.now().plus(2, ChronoUnit.DAYS)
                .truncatedTo(ChronoUnit.HOURS);

        request.setProposedSlot(proposedTime);
        request.setStatus(AutoScheduleStatus.PROPOSED);
        request.setAiReasoning(reasoning);

        AutoScheduleRequest saved = autoScheduleRequestRepository.save(request);
        log.info("Proposed slot {} for request {}", proposedTime, requestId);
        return saved;
    }

    @Transactional
    public AutoScheduleRequest autoConfirm(UUID requestId) {
        AutoScheduleRequest request = autoScheduleRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Auto-schedule request not found: " + requestId));

        if (request.isConflictDetected()) {
            log.warn("Cannot auto-confirm request {} due to detected conflict", requestId);
            request.setStatus(AutoScheduleStatus.FAILED);
            return autoScheduleRequestRepository.save(request);
        }

        request.setConfirmedSlot(request.getProposedSlot());
        request.setStatus(AutoScheduleStatus.CONFIRMED);
        request.setAutoConfirmed(true);
        request.setResolvedAt(Instant.now());

        AutoScheduleRequest saved = autoScheduleRequestRepository.save(request);
        log.info("Auto-confirmed schedule request {}", requestId);
        return saved;
    }

    @Transactional
    public AutoScheduleRequest autoReschedule(UUID requestId, String declineReason) {
        AutoScheduleRequest request = autoScheduleRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Auto-schedule request not found: " + requestId));

        // Find next best slot
        Instant nextSlot = request.getProposedSlot() != null
                ? request.getProposedSlot().plus(1, ChronoUnit.DAYS)
                : Instant.now().plus(3, ChronoUnit.DAYS);

        request.setProposedSlot(nextSlot);
        request.setStatus(AutoScheduleStatus.RESCHEDULED);
        request.setRescheduleCount(request.getRescheduleCount() + 1);
        request.setAiReasoning("Rescheduled due to: " + declineReason + ". New slot proposed.");

        AutoScheduleRequest saved = autoScheduleRequestRepository.save(request);
        log.info("Rescheduled request {} (attempt {}): {}", requestId, saved.getRescheduleCount(), declineReason);
        return saved;
    }

    @Transactional(readOnly = true)
    public AutoScheduleRequest getStatus(UUID requestId) {
        return autoScheduleRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Auto-schedule request not found: " + requestId));
    }

    private String findBestTimeSlotViaAI(AutoScheduleRequest request) {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            return "Default scheduling: proposed next available business hour slot based on duration of "
                    + request.getDurationMinutes() + " minutes.";
        }

        try {
            String prompt = "Suggest the best interview time slot for a " + request.getDurationMinutes()
                    + "-minute interview. Consider typical business hours and minimize scheduling conflicts. "
                    + "Provide reasoning for the suggestion.";

            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", "You are a scheduling optimization AI."),
                            Map.of("role", "user", "content", prompt)
                    ),
                    "max_tokens", 200,
                    "temperature", 0.5
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri(apiUrl)
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("AI scheduling suggestion failed: {}", e.getMessage());
        }

        return "Default scheduling: proposed next available business hour slot.";
    }
}
