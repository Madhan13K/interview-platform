package com.interview_platform_backend.interview_platform_backend.webhookretry.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "webhook_retry_queue")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookRetryQueue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID webhookId;

    @Column(nullable = false)
    private String endpointUrl;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String payload;

    @Builder.Default
    private int attempt = 0;

    @Builder.Default
    private int maxAttempts = 5;

    private Instant nextRetryAt;

    @Column(columnDefinition = "TEXT")
    private String lastError;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RetryStatus status = RetryStatus.PENDING;

    private Instant createdAt;

    private Instant deliveredAt;

    public enum RetryStatus {
        PENDING, RETRYING, DELIVERED, DEAD_LETTER
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
