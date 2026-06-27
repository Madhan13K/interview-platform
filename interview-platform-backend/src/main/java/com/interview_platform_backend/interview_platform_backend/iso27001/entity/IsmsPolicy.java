package com.interview_platform_backend.interview_platform_backend.iso27001.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "isms_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IsmsPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "policy_number", nullable = false, unique = true, length = 20)
    private String policyNumber;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PolicyCategory category;

    @Column(length = 20)
    private String version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PolicyStatus status;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "owner")
    private UUID owner;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "effective_date")
    private Instant effectiveDate;

    @Column(name = "review_date")
    private Instant reviewDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public enum PolicyCategory {
        ACCESS_CONTROL,
        ASSET_MANAGEMENT,
        CRYPTOGRAPHY,
        OPERATIONS_SECURITY,
        COMMUNICATIONS_SECURITY,
        SUPPLIER_RELATIONS,
        INCIDENT_MANAGEMENT,
        BUSINESS_CONTINUITY,
        COMPLIANCE
    }

    public enum PolicyStatus {
        DRAFT,
        REVIEW,
        APPROVED,
        ACTIVE,
        RETIRED
    }
}
