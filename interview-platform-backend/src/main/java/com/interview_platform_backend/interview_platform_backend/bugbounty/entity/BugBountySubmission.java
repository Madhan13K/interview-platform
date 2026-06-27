package com.interview_platform_backend.interview_platform_backend.bugbounty.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bug_bounty_submissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BugBountySubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID programId;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Column(nullable = false)
    private String category;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String stepsToReproduce;

    @Column(columnDefinition = "TEXT")
    private String impact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status;

    @Column(nullable = false)
    private double reward;

    private String reporterAlias;

    private String reporterEmail;

    @Column(nullable = false)
    private Instant submittedAt;

    private Instant triagedAt;

    private Instant resolvedAt;

    @PrePersist
    protected void onCreate() {
        if (submittedAt == null) {
            submittedAt = Instant.now();
        }
    }

    public enum Severity {
        CRITICAL, HIGH, MEDIUM, LOW, NONE
    }

    public enum SubmissionStatus {
        NEW, TRIAGING, ACCEPTED, DUPLICATE, INFORMATIVE, NOT_APPLICABLE, RESOLVED
    }
}
