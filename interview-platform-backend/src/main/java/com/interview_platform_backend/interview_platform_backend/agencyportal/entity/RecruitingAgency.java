package com.interview_platform_backend.interview_platform_backend.agencyportal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "recruiting_agencies", indexes = {
        @Index(name = "idx_recruiting_agencies_status", columnList = "status"),
        @Index(name = "idx_recruiting_agencies_contract_type", columnList = "contractType")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecruitingAgency {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String contactEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContractType contractType;

    @Column(nullable = false)
    private double feePercentage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AgencyStatus status;

    @Column(nullable = false)
    private int slaResponseHours;

    @Column(nullable = false)
    @Builder.Default
    private int totalPlacements = 0;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum ContractType {
        CONTINGENCY, RETAINED, RPO
    }

    public enum AgencyStatus {
        ACTIVE, SUSPENDED, TERMINATED
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
