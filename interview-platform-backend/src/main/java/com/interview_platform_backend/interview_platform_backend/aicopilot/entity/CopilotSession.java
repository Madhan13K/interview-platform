package com.interview_platform_backend.interview_platform_backend.aicopilot.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "copilot_sessions", indexes = {
        @Index(name = "idx_copilot_sessions_interview_id", columnList = "interviewId"),
        @Index(name = "idx_copilot_sessions_interviewer_id", columnList = "interviewerId"),
        @Index(name = "idx_copilot_sessions_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CopilotSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID interviewId;

    @Column(nullable = false)
    private UUID interviewerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CopilotStatus status = CopilotStatus.ACTIVE;

    @Builder.Default
    private int suggestionsGenerated = 0;

    @Builder.Default
    private int biasAlertsTriggered = 0;

    @Column(columnDefinition = "TEXT")
    private String competenciesCovered;

    @Column(columnDefinition = "TEXT")
    private String competenciesRemaining;

    @Builder.Default
    private double overallScore = 0.0;

    private Instant startedAt;

    private Instant endedAt;

    public enum CopilotStatus {
        ACTIVE,
        PAUSED,
        COMPLETED
    }

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = Instant.now();
        }
    }
}
