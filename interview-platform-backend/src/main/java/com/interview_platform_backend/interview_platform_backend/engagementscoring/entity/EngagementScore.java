package com.interview_platform_backend.interview_platform_backend.engagementscoring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "engagement_scores", indexes = {
        @Index(name = "idx_engagement_scores_candidate", columnList = "candidateId"),
        @Index(name = "idx_engagement_scores_overall", columnList = "overallScore")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EngagementScore {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID candidateId;

    @Column(nullable = false)
    @Builder.Default
    private double overallScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private double responseTimeScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private double portalActivityScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private double documentCompletionScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private double communicationScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private Instant lastCalculated = Instant.now();

    @Column(columnDefinition = "TEXT")
    private String factors;

    @PreUpdate
    protected void onUpdate() {
        lastCalculated = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (lastCalculated == null) {
            lastCalculated = Instant.now();
        }
    }
}
