package com.interview_platform_backend.interview_platform_backend.talentcommunity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "community_events", indexes = {
        @Index(name = "idx_community_events_type", columnList = "eventType"),
        @Index(name = "idx_community_events_status", columnList = "status"),
        @Index(name = "idx_community_events_scheduled", columnList = "scheduledAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;

    @Column(nullable = false)
    private Instant scheduledAt;

    @Column(nullable = false)
    @Builder.Default
    private int registrationCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int attendeeCount = 0;

    private String recordingUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EventStatus status = EventStatus.UPCOMING;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public enum EventType {
        WEBINAR,
        MEETUP,
        HACKATHON,
        WORKSHOP,
        AMA
    }

    public enum EventStatus {
        UPCOMING,
        LIVE,
        COMPLETED,
        CANCELLED
    }
}
