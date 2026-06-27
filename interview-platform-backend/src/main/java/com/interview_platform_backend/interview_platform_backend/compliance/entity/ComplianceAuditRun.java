package com.interview_platform_backend.interview_platform_backend.compliance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "compliance_audit_runs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceAuditRun {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditType auditType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditStatus status;

    @Column(nullable = false)
    private int totalChecks;

    @Column(nullable = false)
    private int passedChecks;

    @Column(nullable = false)
    private int failedChecks;

    @Column(nullable = false)
    private int warningChecks;

    @Column(columnDefinition = "TEXT")
    private String findings;

    @Column(nullable = false)
    private double score;

    private String triggeredBy;

    private Instant startedAt;

    private Instant completedAt;

    private Instant nextScheduled;

    public enum AuditType {
        SOC2, GDPR, HIPAA, ISO27001, PCI_DSS
    }

    public enum AuditStatus {
        SCHEDULED, RUNNING, PASSED, FAILED, PARTIAL
    }
}
