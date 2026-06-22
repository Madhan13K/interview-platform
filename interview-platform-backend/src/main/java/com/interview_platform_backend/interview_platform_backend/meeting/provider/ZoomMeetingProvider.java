package com.interview_platform_backend.interview_platform_backend.meeting.provider;

import com.interview_platform_backend.interview_platform_backend.meeting.entity.MeetingProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Real Zoom meeting link provider using Zoom REST API.
 * Requires Server-to-Server OAuth app from marketplace.zoom.us
 * 
 * Config required:
 * - app.meeting.zoom.account-id
 * - app.meeting.zoom.client-id
 * - app.meeting.zoom.client-secret
 */
@Component
@ConditionalOnProperty(name = "app.meeting.zoom.enabled", havingValue = "true", matchIfMissing = false)
public class ZoomMeetingProvider implements MeetingProviderStrategy {

    private static final Logger log = LoggerFactory.getLogger(ZoomMeetingProvider.class);

    @Value("${app.meeting.zoom.account-id:}")
    private String accountId;

    @Value("${app.meeting.zoom.client-id:}")
    private String clientId;

    @Value("${app.meeting.zoom.client-secret:}")
    private String clientSecret;

    private final RestClient restClient = RestClient.create();

    @Override
    public MeetingProvider getProviderType() {
        return MeetingProvider.ZOOM;
    }

    @Override
    public MeetingDetails generateMeeting(String topic, Instant startTime, Instant endTime, int durationMinutes) {
        if (clientId == null || clientId.isBlank() || clientSecret == null || clientSecret.isBlank()) {
            log.warn("Zoom credentials not configured. Generating simulated meeting link.");
            return generateSimulatedMeeting(topic, startTime, endTime, durationMinutes);
        }

        try {
            // Step 1: Get OAuth access token (Server-to-Server OAuth)
            String accessToken = getAccessToken();

            // Step 2: Create meeting via Zoom API
            Map<String, Object> meetingBody = Map.of(
                    "topic", topic,
                    "type", 2, // Scheduled meeting
                    "start_time", startTime.toString(),
                    "duration", durationMinutes,
                    "timezone", "UTC",
                    "settings", Map.of(
                            "host_video", true,
                            "participant_video", true,
                            "join_before_host", true,
                            "waiting_room", false,
                            "auto_recording", "cloud"
                    )
            );

            var response = restClient.post()
                    .uri("https://api.zoom.us/v2/users/me/meetings")
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .body(meetingBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null) {
                String meetingUrl = (String) response.get("join_url");
                String hostUrl = (String) response.get("start_url");
                String meetingId = String.valueOf(response.get("id"));
                String passcode = (String) response.get("password");

                Instant expiresAt = endTime != null
                        ? endTime.plus(1, ChronoUnit.HOURS)
                        : startTime.plus(durationMinutes + 60, ChronoUnit.MINUTES);

                log.info("Zoom meeting created: ID={}, URL={}", meetingId, meetingUrl);
                return new MeetingDetails(meetingUrl, hostUrl, meetingId, passcode, expiresAt);
            }

            throw new RuntimeException("Empty response from Zoom API");

        } catch (Exception e) {
            log.error("Failed to create Zoom meeting: {}. Falling back to simulated.", e.getMessage());
            return generateSimulatedMeeting(topic, startTime, endTime, durationMinutes);
        }
    }

    private String getAccessToken() {
        String credentials = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes());

        var tokenResponse = restClient.post()
                .uri("https://zoom.us/oauth/token?grant_type=account_credentials&account_id=" + accountId)
                .header("Authorization", "Basic " + credentials)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .retrieve()
                .body(Map.class);

        if (tokenResponse != null && tokenResponse.containsKey("access_token")) {
            return (String) tokenResponse.get("access_token");
        }
        throw new RuntimeException("Failed to obtain Zoom access token");
    }

    private MeetingDetails generateSimulatedMeeting(String topic, Instant startTime, Instant endTime, int durationMinutes) {
        String meetingId = String.valueOf(1000000000L + (long)(Math.random() * 9000000000L));
        String passcode = UUID.randomUUID().toString().substring(0, 6);
        String meetingUrl = "https://zoom.us/j/" + meetingId + "?pwd=" + passcode;
        String hostUrl = "https://zoom.us/s/" + meetingId + "?zak=host-token";
        Instant expiresAt = endTime != null
                ? endTime.plus(1, ChronoUnit.HOURS)
                : startTime.plus(durationMinutes + 60, ChronoUnit.MINUTES);
        return new MeetingDetails(meetingUrl, hostUrl, meetingId, passcode, expiresAt);
    }
}
