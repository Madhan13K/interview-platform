package com.interview_platform_backend.interview_platform_backend.headcount.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "headcount_plans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeadcountPlan {

    public enum Status {
        DRAFT, APPROVED, IN_PROGRESS, COMPLETED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String quarter;

    private int totalBudget;

    @Builder.Default
    private int filledPositions = 0;

    @Builder.Default
    private int openPositions = 0;

    @Builder.Default
    private int pipelineCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    private UUID approvedBy;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = Status.DRAFT;
        }
    }
}
