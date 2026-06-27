package com.interview_platform_backend.interview_platform_backend.recordinghighlights.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "recording_highlights", indexes = {
        @Index(name = "idx_recording_highlights_recording", columnList = "recordingId"),
        @Index(name = "idx_recording_highlights_interview", columnList = "interviewId"),
        @Index(name = "idx_recording_highlights_type", columnList = "type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordingHighlight {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID recordingId;

    @Column(nullable = false)
    private UUID interviewId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HighlightType type;

    @Column(nullable = false)
    private long startTimeMs;

    @Column(nullable = false)
    private long endTimeMs;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(nullable = false)
    @Builder.Default
    private double aiScore = 0.0;

    private String aiReason;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum HighlightType {
        BEST_ANSWER, RED_FLAG, KEY_MOMENT, TECHNICAL_EXCELLENCE, COMMUNICATION_ISSUE
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
