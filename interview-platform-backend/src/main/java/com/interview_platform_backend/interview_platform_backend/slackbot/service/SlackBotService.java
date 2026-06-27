package com.interview_platform_backend.interview_platform_backend.slackbot.service;

import com.interview_platform_backend.interview_platform_backend.slackbot.entity.SlackBotConfig;
import com.interview_platform_backend.interview_platform_backend.slackbot.repository.SlackBotConfigRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class SlackBotService {

    private static final Logger log = LoggerFactory.getLogger(SlackBotService.class);

    private final SlackBotConfigRepository configRepository;
    private final RestClient restClient = RestClient.create();

    public Map<String, Object> handleSlashCommand(String command, Map<String, String> params) {
        log.info("Handling slash command: {} with params: {}", command, params);

        Map<String, Object> response = new HashMap<>();

        switch (command) {
            case "/interview-create":
                response.put("response_type", "ephemeral");
                response.put("text", "Creating new interview... Use the interactive form to complete setup.");
                response.put("action", "interview_create");
                break;
            case "/interview-list":
                response.put("response_type", "ephemeral");
                response.put("text", "Fetching your upcoming interviews...");
                response.put("action", "interview_list");
                break;
            case "/candidate-view":
                String candidateId = params.getOrDefault("candidate_id", "");
                response.put("response_type", "ephemeral");
                response.put("text", "Fetching candidate details for: " + candidateId);
                response.put("action", "candidate_view");
                break;
            case "/offer-approve":
                response.put("response_type", "ephemeral");
                response.put("text", "Processing offer approval...");
                response.put("action", "offer_approve");
                break;
            default:
                response.put("response_type", "ephemeral");
                response.put("text", "Unknown command: " + command);
                break;
        }

        return response;
    }

    public void sendInteractiveMessage(String channelId, Map<String, Object> blocks) {
        log.info("Sending interactive message to channel [{}]", channelId);

        SlackBotConfig config = configRepository.findByChannelId(channelId)
                .orElseThrow(() -> new RuntimeException("No bot config found for channel: " + channelId));

        if (!config.isEnabled()) {
            log.warn("Bot is disabled for channel [{}]", channelId);
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("channel", channelId);
        payload.put("blocks", blocks);

        try {
            restClient.post()
                    .uri("https://slack.com/api/chat.postMessage")
                    .header("Authorization", "Bearer " + config.getBotToken())
                    .header("Content-Type", "application/json")
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            log.info("Interactive message sent to channel [{}]", channelId);
        } catch (Exception e) {
            log.error("Failed to send message to channel [{}]: {}", channelId, e.getMessage(), e);
        }
    }

    public Map<String, Object> processInteraction(Map<String, Object> payload) {
        log.info("Processing interaction payload: type={}", payload.get("type"));

        Map<String, Object> response = new HashMap<>();
        String type = (String) payload.getOrDefault("type", "unknown");

        switch (type) {
            case "block_actions":
                response.put("status", "acknowledged");
                response.put("message", "Action processed");
                break;
            case "view_submission":
                response.put("status", "acknowledged");
                response.put("message", "Form submitted");
                break;
            default:
                response.put("status", "unknown_type");
                response.put("message", "Unhandled interaction type: " + type);
                break;
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<SlackBotConfig> getConfigs(UUID organizationId) {
        return configRepository.findByOrganizationId(organizationId);
    }
}
