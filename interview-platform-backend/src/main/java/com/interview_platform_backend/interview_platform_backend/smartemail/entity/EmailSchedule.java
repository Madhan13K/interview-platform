package com.interview_platform_backend.interview_platform_backend.smartemail.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "email_schedules", indexes = {
        @Index(name = "idx_email_schedules_status", columnList = "status"),
        @Index(name = "idx_email_schedules_scheduled_at", columnList = "scheduledAt"),
        @Index(name = "idx_email_schedules_recipient", columnList = "recipientEmail")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String recipientEmail;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String templateId;

    @Column(nullable = false)
    private Instant scheduledAt;

    private Instant optimalSendTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EmailStatus status = EmailStatus.PENDING;

    @Column(nullable = false)
    @Builder.Default
    private String timezone = "UTC";

    @Column(nullable = false)
    @Builder.Default
    private double engagementScore = 0.0;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum EmailStatus {
        PENDING, SENT, FAILED, CANCELLED
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
