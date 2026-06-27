package com.interview_platform_backend.interview_platform_backend.videoanalysis.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "video_analysis_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoAnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID interviewId;

    @Column(nullable = false)
    private UUID candidateId;

    @Column(nullable = false)
    private String videoUrl;

    @Column(nullable = false)
    private double engagementScore;

    @Column(nullable = false)
    private double confidenceScore;

    @Column(nullable = false)
    private double eyeContactScore;

    @Column(nullable = false)
    private double bodyLanguageScore;

    @Column(nullable = false)
    private double overallScore;

    @Column(columnDefinition = "TEXT")
    private String emotionBreakdown;

    @Column(columnDefinition = "TEXT")
    private String gestureAnalysis;

    @Column(columnDefinition = "TEXT")
    private String timelineData;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant completedAt;

    private long processingDurationMs;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.status == null) {
            this.status = Status.PENDING;
        }
    }

    public enum Status {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED
    }
}
