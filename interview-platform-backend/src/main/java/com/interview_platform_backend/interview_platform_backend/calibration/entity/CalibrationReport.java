package com.interview_platform_backend.interview_platform_backend.calibration.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "calibration_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalibrationReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID interviewerId;

    @Column(nullable = false)
    private UUID organizationId;

    private double avgRating;

    private int totalInterviews;

    @Column(columnDefinition = "TEXT")
    private String ratingDistribution;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BiasIndicator biasIndicator = BiasIndicator.NEUTRAL;

    private double calibrationScore;

    private String topStrength;

    private String topWeakness;

    private double comparedToPeers;

    @Column(nullable = false)
    @Builder.Default
    private Instant calculatedAt = Instant.now();

    public enum BiasIndicator {
        LENIENT,
        NEUTRAL,
        STRICT
    }
}
