package com.interview_platform_backend.interview_platform_backend.resumeranking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "resume_ranks", indexes = {
        @Index(name = "idx_resume_ranks_job_position", columnList = "jobPositionId"),
        @Index(name = "idx_resume_ranks_candidate", columnList = "candidateId"),
        @Index(name = "idx_resume_ranks_overall_rank", columnList = "overallRank"),
        @Index(name = "idx_resume_ranks_fit_score", columnList = "fitScore")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeRank {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID jobPositionId;

    @Column(nullable = false)
    private UUID candidateId;

    @Column(nullable = false)
    @Builder.Default
    private double fitScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private double skillMatchScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private double experienceScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private double educationScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private int overallRank = 0;

    @Column(columnDefinition = "TEXT")
    private String aiReasoning;

    @Column(nullable = false)
    @Builder.Default
    private Instant rankedAt = Instant.now();

    @PrePersist
    protected void onCreate() {
        if (rankedAt == null) {
            rankedAt = Instant.now();
        }
    }
}
