package com.interview_platform_backend.interview_platform_backend.asyncvideov3.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ai_interview_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIInterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID jobPositionId;

    @Column(nullable = false)
    private UUID candidateId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionStatus status = SessionStatus.CREATED;

    @Column(columnDefinition = "TEXT")
    private String questionsAsked;

    @Column(columnDefinition = "TEXT")
    private String candidateResponses;

    @Column(columnDefinition = "TEXT")
    private String aiFollowUps;

    @Builder.Default
    private int totalQuestions = 0;

    @Builder.Default
    private int questionsAnswered = 0;

    @Builder.Default
    private double overallScore = 0.0;

    @Enumerated(EnumType.STRING)
    private AIVerdict aiVerdict;

    @Column(columnDefinition = "TEXT")
    private String aiReasoning;

    private Instant startedAt;

    private Instant completedAt;

    private Instant expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum SessionStatus {
        CREATED,
        WAITING_CANDIDATE,
        IN_PROGRESS,
        AI_SCORING,
        COMPLETED,
        EXPIRED
    }

    public enum AIVerdict {
        STRONG_PASS,
        PASS,
        BORDERLINE,
        FAIL
    }
}
