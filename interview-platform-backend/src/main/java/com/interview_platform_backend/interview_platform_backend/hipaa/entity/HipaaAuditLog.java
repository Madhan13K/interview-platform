package com.interview_platform_backend.interview_platform_backend.hipaa.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hipaa_audit_logs", indexes = {
        @Index(name = "idx_hipaa_audit_patient", columnList = "patient_identifier"),
        @Index(name = "idx_hipaa_audit_user", columnList = "user_id"),
        @Index(name = "idx_hipaa_audit_timestamp", columnList = "timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HipaaAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "patient_identifier", nullable = false)
    private String patientIdentifier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AuditAction action;

    @Column(name = "resource_type", nullable = false, length = 100)
    private String resourceType;

    @Column(name = "resource_id")
    private UUID resourceId;

    @Column(name = "access_reason")
    private String accessReason;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "organization_id")
    private UUID organizationId;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }

    public enum AuditAction {
        VIEW, CREATE, UPDATE, DELETE, EXPORT, PRINT, SHARE
    }
}
