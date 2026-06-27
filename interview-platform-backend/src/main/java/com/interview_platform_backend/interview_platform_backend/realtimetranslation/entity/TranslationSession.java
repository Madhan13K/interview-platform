package com.interview_platform_backend.interview_platform_backend.realtimetranslation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "translation_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TranslationSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "interview_id", nullable = false)
    private UUID interviewId;

    @Column(name = "source_language", nullable = false, length = 10)
    @Builder.Default
    private String sourceLanguage = "en";

    @Column(name = "target_language", nullable = false, length = 10)
    @Builder.Default
    private String targetLanguage = "es";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TranslationSessionStatus status = TranslationSessionStatus.ACTIVE;

    @Column(name = "segments_translated", nullable = false)
    @Builder.Default
    private int segmentsTranslated = 0;

    @Column(name = "avg_latency_ms", nullable = false)
    @Builder.Default
    private long avgLatencyMs = 0;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String provider = "openrouter";

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @PrePersist
    protected void onCreate() {
        startedAt = Instant.now();
    }

    public enum TranslationSessionStatus {
        ACTIVE, COMPLETED
    }
}
