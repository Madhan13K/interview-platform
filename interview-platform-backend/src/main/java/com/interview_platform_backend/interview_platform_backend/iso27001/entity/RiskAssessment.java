package com.interview_platform_backend.interview_platform_backend.iso27001.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "risk_assessments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "risk_title", nullable = false)
    private String riskTitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Likelihood likelihood;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Impact impact;

    @Column(name = "risk_score", nullable = false)
    private int riskScore;

    @Column(name = "current_controls", columnDefinition = "TEXT")
    private String currentControls;

    @Enumerated(EnumType.STRING)
    @Column(name = "residual_risk", length = 10)
    private ResidualRisk residualRisk;

    @Column(name = "treatment_plan", columnDefinition = "TEXT")
    private String treatmentPlan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private RiskStatus status;

    @Column(name = "owner")
    private UUID owner;

    @Column(name = "review_date")
    private Instant reviewDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        riskScore = getLikelihoodValue() * getImpactValue();
    }

    public int getLikelihoodValue() {
        if (likelihood == null) return 0;
        return switch (likelihood) {
            case VERY_LOW -> 1;
            case LOW -> 2;
            case MEDIUM -> 3;
            case HIGH -> 4;
            case VERY_HIGH -> 5;
        };
    }

    public int getImpactValue() {
        if (impact == null) return 0;
        return switch (impact) {
            case VERY_LOW -> 1;
            case LOW -> 2;
            case MEDIUM -> 3;
            case HIGH -> 4;
            case VERY_HIGH -> 5;
        };
    }

    public void calculateRiskScore() {
        this.riskScore = getLikelihoodValue() * getImpactValue();
    }

    public enum Likelihood {
        VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH
    }

    public enum Impact {
        VERY_LOW, LOW, MEDIUM, HIGH, VERY_HIGH
    }

    public enum ResidualRisk {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum RiskStatus {
        IDENTIFIED, ASSESSED, TREATED, ACCEPTED, CLOSED
    }
}
