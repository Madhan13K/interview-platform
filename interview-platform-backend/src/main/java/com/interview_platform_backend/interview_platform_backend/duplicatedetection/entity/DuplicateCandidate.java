package com.interview_platform_backend.interview_platform_backend.duplicatedetection.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "duplicate_candidates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DuplicateCandidate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID candidateAId;

    @Column(nullable = false)
    private UUID candidateBId;

    @Column(nullable = false)
    private double matchScore;

    @Column(columnDefinition = "TEXT")
    private String matchedFields;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DuplicateStatus status = DuplicateStatus.DETECTED;

    private Instant detectedAt;

    private Instant resolvedAt;

    private UUID resolvedBy;

    public enum DuplicateStatus {
        DETECTED, CONFIRMED_DUPLICATE, FALSE_POSITIVE, MERGED
    }

    @PrePersist
    protected void onCreate() {
        detectedAt = Instant.now();
    }
}
