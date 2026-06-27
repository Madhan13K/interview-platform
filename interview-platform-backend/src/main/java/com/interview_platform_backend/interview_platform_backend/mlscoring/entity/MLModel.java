package com.interview_platform_backend.interview_platform_backend.mlscoring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ml_models")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MLModel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "model_name", nullable = false)
    private String modelName;

    @Column(name = "model_version", nullable = false)
    private String modelVersion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private MLModelStatus status = MLModelStatus.TRAINING;

    @Column(nullable = false)
    private double accuracy;

    @Column(name = "precision_score", nullable = false)
    private double precision;

    @Column(nullable = false)
    private double recall;

    @Column(name = "f1_score", nullable = false)
    private double f1Score;

    @Column(name = "training_data_size", nullable = false)
    private int trainingDataSize;

    @Column(columnDefinition = "TEXT")
    private String features;

    @Column(name = "trained_at")
    private Instant trainedAt;

    @Column(name = "deployed_at")
    private Instant deployedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public enum MLModelStatus {
        TRAINING, TRAINED, DEPLOYED, DEPRECATED
    }
}
