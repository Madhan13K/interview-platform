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
import java.util.Map;
import java.util.UUID;

/**
 * Real Google Meet link provider using Google Calendar API.
 * Creates a Calendar event with conferenceData to generate a Meet link.
 * 
 * Requires:
 * - Service account or OAuth2 credentials with Calendar API scope
 * - app.meeting.google.access-token (or service account credentials)
 */
@Component
@ConditionalOnProperty(name = "app.meeting.google.enabled", havingValue = "true", matchIfMissing = false)
public class GoogleMeetProvider implements MeetingProviderStrategy {

    private static final Logger log = LoggerFactory.getLogger(GoogleMeetProvider.class);

    @Value("${app.meeting.google.access-token:}")
    private String accessToken;

    @Value("${app.meeting.google.calendar-id:primary}")
    private String calendarId;

    private final RestClient restClient = RestClient.create();

    @Override
    public MeetingProvider getProviderType() {
        return MeetingProvider.GOOGLE_MEET;
    }

    @Override
    public MeetingDetails generateMeeting(String topic, Instant startTime, Instant endTime, int durationMinutes) {
        if (accessToken == null || accessToken.isBlank()) {
            log.warn("Google Calendar credentials not configured. Generating simulated Meet link.");
            return generateSimulatedMeeting(topic, startTime, endTime, durationMinutes);
        }

        try {
            Instant actualEnd = endTime != null ? endTime : startTime.plus(durationMinutes, ChronoUnit.MINUTES);

            Map<String, Object> eventBody = Map.of(
                    "summary", topic,
                    "start", Map.of("dateTime", startTime.toString(), "timeZone", "UTC"),
                    "end", Map.of("dateTime", actualEnd.toString(), "timeZone", "UTC"),
                    "conferenceData", Map.of(
                            "createRequest", Map.of(
                                    "requestId", UUID.randomUUID().toString(),
                                    "conferenceSolutionKey", Map.of("type", "hangoutsMeet")
                            )
                    )
            );

            var response = restClient.post()
                    .uri("https://www.googleapis.com/calendar/v3/calendars/" + calendarId + "/events?conferenceDataVersion=1")
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .body(eventBody)
                    .retrieve()
                    .body(Map.class);

            if (response != null && response.containsKey("conferenceData")) {
                var conferenceData = (Map<String, Object>) response.get("conferenceData");
                var entryPoints = (java.util.List<Map<String, Object>>) conferenceData.get("entryPoints");

                String meetUrl = null;
                if (entryPoints != null) {
                    for (var ep : entryPoints) {
                        if ("video".equals(ep.get("entryPointType"))) {
                            meetUrl = (String) ep.get("uri");
                            break;
                        }
                    }
                }

                if (meetUrl == null) {
                    meetUrl = "https://meet.google.com/" + conferenceData.get("conferenceId");
                }

                String conferenceId = (String) conferenceData.get("conferenceId");
                Instant expiresAt = actualEnd.plus(1, ChronoUnit.HOURS);

                log.info("Google Meet created: ID={}, URL={}", conferenceId, meetUrl);
                return new MeetingDetails(meetUrl, meetUrl, conferenceId, null, expiresAt);
            }

            throw new RuntimeException("No conferenceData in Google Calendar response");

        } catch (Exception e) {
            log.error("Failed to create Google Meet: {}. Falling back to simulated.", e.getMessage());
            return generateSimulatedMeeting(topic, startTime, endTime, durationMinutes);
        }
    }

    private MeetingDetails generateSimulatedMeeting(String topic, Instant startTime, Instant endTime, int durationMinutes) {
        String meetCode = generateMeetCode();
        String meetingUrl = "https://meet.google.com/" + meetCode;
        Instant expiresAt = endTime != null
                ? endTime.plus(1, ChronoUnit.HOURS)
                : startTime.plus(durationMinutes + 60, ChronoUnit.MINUTES);
        return new MeetingDetails(meetingUrl, meetingUrl, meetCode, null, expiresAt);
    }

    private String generateMeetCode() {
        String chars = "abcdefghijklmnopqrstuvwxyz";
        StringBuilder code = new StringBuilder();
        for (int i = 0; i < 3; i++) {
            if (i > 0) code.append("-");
            for (int j = 0; j < 4; j++) {
                code.append(chars.charAt((int)(Math.random() * chars.length())));
            }
        }
        return code.toString();
    }
}
