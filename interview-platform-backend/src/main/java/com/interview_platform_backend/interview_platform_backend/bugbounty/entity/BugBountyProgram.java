package com.interview_platform_backend.interview_platform_backend.bugbounty.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bug_bounty_programs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BugBountyProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private String programName;

    @Column(nullable = false)
    private String platform;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(columnDefinition = "TEXT")
    private String scope;

    @Column(columnDefinition = "TEXT")
    private String rewardTiers;

    @Column(nullable = false)
    private double totalPaid;

    @Column(nullable = false)
    private int totalReports;

    @Column(nullable = false)
    private int validReports;

    @Column(nullable = false)
    private int avgResponseHours;

    private String policyUrl;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant activatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public enum Status {
        DRAFT, ACTIVE, PAUSED, CLOSED
    }
}
