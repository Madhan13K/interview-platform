package com.interview_platform_backend.interview_platform_backend.slackbot;

import com.interview_platform_backend.interview_platform_backend.slackbot.service.SlackBotService;
import com.interview_platform_backend.interview_platform_backend.slackbot.repository.SlackBotConfigRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
@DisplayName("Slack Bot Service Tests")
class SlackBotServiceTest {

    @Mock private SlackBotConfigRepository configRepository;
    @InjectMocks private SlackBotService service;

    @Test
    @DisplayName("should handle /interview-create command")
    void handleCreateCommand() {
        Map<String, String> params = Map.of("text", "Senior Java Developer", "user_id", "U123");
        var result = service.handleSlashCommand("/interview-create", params);
        assertThat(result).isNotNull();
        assertThat(result).containsKey("text");
        assertThat(result.get("text").toString()).contains("Creating new interview");
    }

    @Test
    @DisplayName("should handle /interview-list command")
    void handleListCommand() {
        Map<String, String> params = Map.of("user_id", "U123");
        var result = service.handleSlashCommand("/interview-list", params);
        assertThat(result).isNotNull();
        assertThat(result).containsKey("text");
        assertThat(result.get("text").toString()).contains("Fetching your upcoming interviews");
    }

    @Test
    @DisplayName("should handle unknown command gracefully")
    void handleUnknownCommand() {
        var result = service.handleSlashCommand("/unknown", Map.of());
        assertThat(result).containsKey("text");
        assertThat(result.get("text").toString()).contains("Unknown command");
    }

    @Test
    @DisplayName("should handle /candidate-view command")
    void handleCandidateViewCommand() {
        Map<String, String> params = Map.of("candidate_id", "C456");
        var result = service.handleSlashCommand("/candidate-view", params);
        assertThat(result).isNotNull();
        assertThat(result).containsKey("action");
        assertThat(result.get("action")).isEqualTo("candidate_view");
    }

    @Test
    @DisplayName("should handle /offer-approve command")
    void handleOfferApproveCommand() {
        var result = service.handleSlashCommand("/offer-approve", Map.of());
        assertThat(result).isNotNull();
        assertThat(result.get("action")).isEqualTo("offer_approve");
    }

    @Test
    @DisplayName("should process block_actions interaction")
    void processBlockActionsInteraction() {
        Map<String, Object> payload = Map.of("type", "block_actions");
        var result = service.processInteraction(payload);
        assertThat(result).isNotNull();
        assertThat(result.get("status")).isEqualTo("acknowledged");
    }

    @Test
    @DisplayName("should process view_submission interaction")
    void processViewSubmissionInteraction() {
        Map<String, Object> payload = Map.of("type", "view_submission");
        var result = service.processInteraction(payload);
        assertThat(result).isNotNull();
        assertThat(result.get("status")).isEqualTo("acknowledged");
        assertThat(result.get("message")).isEqualTo("Form submitted");
    }

    @Test
    @DisplayName("should handle unknown interaction type")
    void processUnknownInteraction() {
        Map<String, Object> payload = Map.of("type", "unknown_type");
        var result = service.processInteraction(payload);
        assertThat(result).isNotNull();
        assertThat(result.get("status")).isEqualTo("unknown_type");
    }
}
