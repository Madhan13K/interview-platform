package com.interview_platform_backend.interview_platform_backend.livetranscription.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transcription_segments", indexes = {
        @Index(name = "idx_transcription_segments_session_id", columnList = "sessionId"),
        @Index(name = "idx_transcription_segments_sequence", columnList = "sessionId, sequenceNumber")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TranscriptionSegment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID sessionId;

    private String speakerLabel;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    private long startTimeMs;

    private long endTimeMs;

    @Builder.Default
    private double confidence = 0.0;

    @Builder.Default
    private boolean isFinal = false;

    private int sequenceNumber;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
