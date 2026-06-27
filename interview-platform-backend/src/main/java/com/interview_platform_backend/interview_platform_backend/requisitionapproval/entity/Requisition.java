package com.interview_platform_backend.interview_platform_backend.requisitionapproval.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "requisitions", indexes = {
        @Index(name = "idx_requisitions_status", columnList = "status"),
        @Index(name = "idx_requisitions_department", columnList = "department"),
        @Index(name = "idx_requisitions_requested_by", columnList = "requestedBy"),
        @Index(name = "idx_requisitions_current_approver", columnList = "currentApprover")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Requisition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String jobTitle;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private UUID requestedBy;

    @Column(nullable = false)
    private int headcount;

    @Column(columnDefinition = "TEXT")
    private String justification;

    private String budgetImpact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RequisitionStatus status = RequisitionStatus.DRAFT;

    @Column(columnDefinition = "TEXT")
    private String approvalChain;

    private UUID currentApprover;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    private Instant approvedAt;

    public enum RequisitionStatus {
        DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
