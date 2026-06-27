package com.interview_platform_backend.interview_platform_backend.costperhire.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hiring_costs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HiringCost {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private UUID jobPositionId;

    private UUID candidateId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CostType costType;

    @Column(nullable = false)
    private double amount;

    @Column(nullable = false)
    @Builder.Default
    private String currency = "USD";

    private String description;

    private Instant incurredAt;

    private UUID createdBy;

    @Column(nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum CostType {
        RECRUITER_TIME,
        JOB_BOARD,
        AGENCY_FEE,
        TOOL_SUBSCRIPTION,
        TRAVEL,
        RELOCATION,
        SIGNING_BONUS,
        BACKGROUND_CHECK,
        OTHER
    }
}
