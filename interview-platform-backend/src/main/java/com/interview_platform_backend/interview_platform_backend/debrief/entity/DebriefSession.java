package com.interview_platform_backend.interview_platform_backend.debrief.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "debrief_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebriefSession {

    public enum Status {
        SCHEDULED, IN_PROGRESS, CALIBRATING, COMPLETED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID interviewId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(columnDefinition = "TEXT")
    private String participants;

    @Column(nullable = false)
    @Builder.Default
    private boolean anonymousMode = true;

    @Builder.Default
    private boolean consensusReached = false;

    @Column(columnDefinition = "TEXT")
    private String finalRecommendation;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant completedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = Status.SCHEDULED;
        }
    }
}
