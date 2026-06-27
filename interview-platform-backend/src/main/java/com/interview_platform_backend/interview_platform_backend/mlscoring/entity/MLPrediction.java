package com.interview_platform_backend.interview_platform_backend.mlscoring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ml_predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MLPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "model_id", nullable = false)
    private UUID modelId;

    @Column(name = "candidate_id", nullable = false)
    private UUID candidateId;

    @Column(name = "job_position_id", nullable = false)
    private UUID jobPositionId;

    @Column(name = "predicted_score", nullable = false)
    private double predictedScore;

    @Column(nullable = false)
    private double confidence;

    @Column(columnDefinition = "TEXT")
    private String features;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PredictionOutcome prediction;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public enum PredictionOutcome {
        LIKELY_HIRE, POSSIBLE_HIRE, UNLIKELY_HIRE
    }
}
