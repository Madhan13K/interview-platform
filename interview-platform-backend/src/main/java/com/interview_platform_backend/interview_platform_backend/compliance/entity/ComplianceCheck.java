package com.interview_platform_backend.interview_platform_backend.compliance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "compliance_checks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID auditRunId;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String checkName;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CheckStatus status;

    @Column(columnDefinition = "TEXT")
    private String evidence;

    @Column(length = 2000)
    private String remediation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Column(nullable = false)
    private Instant createdAt;

    public enum CheckStatus {
        PASS, FAIL, WARNING, SKIP
    }

    public enum Severity {
        CRITICAL, HIGH, MEDIUM, LOW, INFO
    }
}
