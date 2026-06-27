package com.interview_platform_backend.interview_platform_backend.hipaa.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "baa_agreements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessAssociateAgreement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "associate_name", nullable = false)
    private String associateName;

    @Column(name = "associate_type", nullable = false, length = 50)
    private String associateType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private BaaStatus status;

    @Column(name = "effective_date")
    private Instant effectiveDate;

    @Column(name = "expiration_date")
    private Instant expirationDate;

    @Column(name = "document_url")
    private String documentUrl;

    @Column(columnDefinition = "TEXT")
    private String safeguards;

    @Column(name = "breach_notification_hours")
    @Builder.Default
    private int breachNotificationHours = 72;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public enum BaaStatus {
        DRAFT, PENDING_SIGNATURE, ACTIVE, EXPIRED, TERMINATED
    }
}
