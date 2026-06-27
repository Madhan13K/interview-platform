package com.interview_platform_backend.interview_platform_backend.asyncvideov2.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "async_video_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsyncVideoSession {

    public enum Status {
        DRAFT, SENT, IN_PROGRESS, SUBMITTED, SCORED, EXPIRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID jobPositionId;

    @Column(nullable = false)
    private UUID candidateId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(columnDefinition = "TEXT")
    private String questions;

    @Column(nullable = false)
    @Builder.Default
    private int maxRetries = 3;

    @Column(nullable = false)
    @Builder.Default
    private int retriesUsed = 0;

    private int timeLimit;

    private UUID rubricId;

    private double totalScore;

    @Column(columnDefinition = "TEXT")
    private String aiAnalysis;

    private Instant expiresAt;

    private Instant submittedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = Status.DRAFT;
        }
    }
}
