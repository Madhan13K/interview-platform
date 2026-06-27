package com.interview_platform_backend.interview_platform_backend.analytics.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "stage_dropout_analysis")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StageDropoutAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "pipeline_id")
    private UUID pipelineId;

    @Column(name = "stage_name", nullable = false, length = 100)
    private String stageName;

    @Column(name = "stage_order", nullable = false)
    private Integer stageOrder;

    @Column(name = "candidates_entered")
    @Builder.Default
    private Integer candidatesEntered = 0;

    @Column(name = "candidates_passed")
    @Builder.Default
    private Integer candidatesPassed = 0;

    @Column(name = "candidates_rejected")
    @Builder.Default
    private Integer candidatesRejected = 0;

    @Column(name = "candidates_withdrew")
    @Builder.Default
    private Integer candidatesWithdrew = 0;

    @Column(name = "avg_days_in_stage", precision = 10, scale = 2)
    private BigDecimal avgDaysInStage;

    @Column(name = "dropout_rate", precision = 5, scale = 2)
    private BigDecimal dropoutRate;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "computed_at", nullable = false)
    private Instant computedAt;

    @PrePersist
    protected void onCreate() {
        if (computedAt == null) {
            computedAt = Instant.now();
        }
    }
}
