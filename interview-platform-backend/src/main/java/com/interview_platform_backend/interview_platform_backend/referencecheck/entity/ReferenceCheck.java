package com.interview_platform_backend.interview_platform_backend.referencecheck.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reference_checks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReferenceCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "candidate_id", nullable = false)
    private UUID candidateId;

    @Column(name = "reference_name", nullable = false)
    private String referenceName;

    @Column(name = "reference_email", nullable = false)
    private String referenceEmail;

    @Column(name = "reference_phone")
    private String referencePhone;

    @Column(nullable = false, length = 30)
    private String relationship;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ReferenceCheckStatus status = ReferenceCheckStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String questionnaire;

    @Column(name = "overall_rating")
    private Integer overallRating;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public enum ReferenceCheckStatus {
        PENDING, SENT, IN_PROGRESS, COMPLETED, DECLINED, EXPIRED
    }
}
