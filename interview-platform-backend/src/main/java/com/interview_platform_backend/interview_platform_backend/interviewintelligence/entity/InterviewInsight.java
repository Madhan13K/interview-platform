package com.interview_platform_backend.interview_platform_backend.interviewintelligence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "interview_insights", indexes = {
        @Index(name = "idx_interview_insights_org_id", columnList = "organizationId"),
        @Index(name = "idx_interview_insights_type", columnList = "insightType"),
        @Index(name = "idx_interview_insights_period", columnList = "period")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewInsight {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InsightType insightType;

    @Column(nullable = false)
    private String metric;

    @Column(nullable = false)
    private double value;

    @Column(columnDefinition = "TEXT")
    private String context;

    @Column(nullable = false)
    private int sampleSize;

    @Column(nullable = false)
    private double confidence;

    @Column(nullable = false)
    private String period;

    @Column(nullable = false)
    private Instant generatedAt;

    public enum InsightType {
        FAILURE_POINT,
        BEST_QUESTION,
        TIME_PATTERN,
        DROP_OFF_STAGE,
        SKILL_GAP,
        INTERVIEWER_PATTERN
    }
}
