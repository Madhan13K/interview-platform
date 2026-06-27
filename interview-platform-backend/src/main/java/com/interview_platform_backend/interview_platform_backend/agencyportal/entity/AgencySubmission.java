package com.interview_platform_backend.interview_platform_backend.agencyportal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agency_submissions", indexes = {
        @Index(name = "idx_agency_submissions_agency", columnList = "agencyId"),
        @Index(name = "idx_agency_submissions_candidate", columnList = "candidateId"),
        @Index(name = "idx_agency_submissions_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgencySubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID agencyId;

    @Column(nullable = false)
    private UUID candidateId;

    @Column(nullable = false)
    private UUID jobPositionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant submittedAt = Instant.now();

    @Column(nullable = false)
    private double fee;

    public enum SubmissionStatus {
        SUBMITTED, UNDER_REVIEW, SHORTLISTED, REJECTED, PLACED
    }

    @PrePersist
    protected void onCreate() {
        if (submittedAt == null) {
            submittedAt = Instant.now();
        }
    }
}
