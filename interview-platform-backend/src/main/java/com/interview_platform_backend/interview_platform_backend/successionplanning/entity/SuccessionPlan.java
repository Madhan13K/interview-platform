package com.interview_platform_backend.interview_platform_backend.successionplanning.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "succession_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuccessionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String positionTitle;

    @Column(nullable = false)
    private String department;

    private UUID currentHolderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskLevel riskLevel;

    @Column(columnDefinition = "TEXT")
    private String successors;

    private Instant lastReviewDate;

    private Instant nextReviewDate;

    @Column(nullable = false)
    private UUID createdBy;

    private Instant createdAt;

    public enum RiskLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
