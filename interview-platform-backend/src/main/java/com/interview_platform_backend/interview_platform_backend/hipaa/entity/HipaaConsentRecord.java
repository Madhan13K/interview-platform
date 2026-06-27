package com.interview_platform_backend.interview_platform_backend.hipaa.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hipaa_consent_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HipaaConsentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_identifier", nullable = false)
    private String patientIdentifier;

    @Enumerated(EnumType.STRING)
    @Column(name = "consent_type", nullable = false, length = 30)
    private ConsentType consentType;

    @Column(nullable = false)
    private boolean granted;

    @Column(name = "granted_at")
    private Instant grantedAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "document_url")
    private String documentUrl;

    @Column(name = "witness_name")
    private String witnessName;

    @PrePersist
    protected void onCreate() {
        if (grantedAt == null && granted) {
            grantedAt = Instant.now();
        }
    }

    public enum ConsentType {
        TREATMENT,
        PAYMENT,
        HEALTHCARE_OPERATIONS,
        RESEARCH,
        MARKETING
    }
}
