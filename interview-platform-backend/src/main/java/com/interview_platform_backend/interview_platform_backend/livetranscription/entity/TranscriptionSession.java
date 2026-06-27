package com.interview_platform_backend.interview_platform_backend.livetranscription.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transcription_sessions", indexes = {
        @Index(name = "idx_transcription_sessions_interview_id", columnList = "interviewId"),
        @Index(name = "idx_transcription_sessions_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TranscriptionSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID interviewId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TranscriptionStatus status;

    @Column(nullable = false)
    private String provider;

    @Column(nullable = false)
    @Builder.Default
    private String language = "en";

    private Instant startedAt;

    private Instant endedAt;

    @Builder.Default
    private long totalDurationMs = 0;

    @Builder.Default
    private int wordCount = 0;

    @Builder.Default
    private int speakerCount = 0;

    @Builder.Default
    private double confidenceAvg = 0.0;

    @Column(columnDefinition = "TEXT")
    private String fullTranscript;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum TranscriptionStatus {
        CONNECTING,
        ACTIVE,
        PAUSED,
        COMPLETED,
        FAILED
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
