package com.interview_platform_backend.interview_platform_backend.analytics.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "hiring_funnel_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HiringFunnelMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "pipeline_id")
    private UUID pipelineId;

    @Column(name = "pipeline_name", length = 200)
    private String pipelineName;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "period_type", nullable = false, length = 10)
    private String periodType;

    // Stage counts
    @Column(name = "total_candidates")
    @Builder.Default
    private Integer totalCandidates = 0;

    @Column(name = "stage_screening")
    @Builder.Default
    private Integer stageScreening = 0;

    @Column(name = "stage_technical")
    @Builder.Default
    private Integer stageTechnical = 0;

    @Column(name = "stage_hr")
    @Builder.Default
    private Integer stageHr = 0;

    @Column(name = "stage_final")
    @Builder.Default
    private Integer stageFinal = 0;

    @Column(name = "stage_offer")
    @Builder.Default
    private Integer stageOffer = 0;

    // Outcomes
    @Column(name = "total_hired")
    @Builder.Default
    private Integer totalHired = 0;

    @Column(name = "total_rejected")
    @Builder.Default
    private Integer totalRejected = 0;

    @Column(name = "total_withdrawn")
    @Builder.Default
    private Integer totalWithdrawn = 0;

    // Conversion rates (percentage 0-100)
    @Column(name = "screening_to_technical", precision = 5, scale = 2)
    private BigDecimal screeningToTechnical;

    @Column(name = "technical_to_hr", precision = 5, scale = 2)
    private BigDecimal technicalToHr;

    @Column(name = "hr_to_final", precision = 5, scale = 2)
    private BigDecimal hrToFinal;

    @Column(name = "final_to_offer", precision = 5, scale = 2)
    private BigDecimal finalToOffer;

    @Column(name = "offer_to_hired", precision = 5, scale = 2)
    private BigDecimal offerToHired;

    @Column(name = "overall_conversion", precision = 5, scale = 2)
    private BigDecimal overallConversion;

    // Time metrics (in hours)
    @Column(name = "avg_time_to_hire", precision = 10, scale = 2)
    private BigDecimal avgTimeToHire;

    @Column(name = "avg_time_in_screening", precision = 10, scale = 2)
    private BigDecimal avgTimeInScreening;

    @Column(name = "avg_time_in_technical", precision = 10, scale = 2)
    private BigDecimal avgTimeInTechnical;

    @Column(name = "avg_time_in_hr", precision = 10, scale = 2)
    private BigDecimal avgTimeInHr;

    @Column(name = "avg_time_in_final", precision = 10, scale = 2)
    private BigDecimal avgTimeInFinal;

    // Source effectiveness
    @Column(name = "top_source", length = 100)
    private String topSource;

    @Column(name = "top_source_count")
    private Integer topSourceCount;

    @Column(name = "computed_at", nullable = false)
    private Instant computedAt;

    @PrePersist
    protected void onCreate() {
        if (computedAt == null) {
            computedAt = Instant.now();
        }
    }
}
