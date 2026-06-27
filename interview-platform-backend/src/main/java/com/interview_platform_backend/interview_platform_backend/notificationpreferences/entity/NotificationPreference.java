package com.interview_platform_backend.interview_platform_backend.notificationpreferences.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_preferences", indexes = {
        @Index(name = "idx_notification_preferences_user", columnList = "userId", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID userId;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean smsEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean pushEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean slackEnabled = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean inAppEnabled = true;

    @Column(nullable = false)
    @Builder.Default
    private String quietHoursStart = "22:00";

    @Column(nullable = false)
    @Builder.Default
    private String quietHoursEnd = "08:00";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DigestFrequency digestFrequency = DigestFrequency.REALTIME;

    @Column(nullable = false)
    @Builder.Default
    private String timezone = "UTC";

    @Column(columnDefinition = "TEXT")
    private String mutedCategories;

    @Column(nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    public enum DigestFrequency {
        REALTIME, HOURLY, DAILY, WEEKLY
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }
}
