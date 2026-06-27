package com.interview_platform_backend.interview_platform_backend.notification.bus;

import lombok.*;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Unified notification event that flows through the notification bus.
 * A single event can target multiple channels simultaneously.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEvent {

    private String eventId;
    private String eventType;             // INTERVIEW_SCHEDULED, FEEDBACK_SUBMITTED, etc.

    // Routing
    private List<Channel> channels;       // Which channels to deliver on
    private Priority priority;

    // Recipient
    private UUID recipientUserId;
    private String recipientEmail;
    private String recipientPhone;
    private String recipientName;

    // Content
    private String title;
    private String subject;               // For email subject line
    private String body;
    private String shortBody;             // For SMS (160 char limit)

    // Metadata
    private UUID referenceId;
    private String referenceType;         // INTERVIEW, FEEDBACK, PIPELINE
    private Map<String, String> metadata;
    private Instant timestamp;

    public enum Channel {
        EMAIL, SMS, PUSH, IN_APP, SLACK, TEAMS
    }

    public enum Priority {
        LOW, NORMAL, HIGH, URGENT
    }
}
