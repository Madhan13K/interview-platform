package com.interview_platform_backend.interview_platform_backend.soc2.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "soc2_controls")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Soc2Control {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String controlId;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String evidenceType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ControlStatus status;

    private Instant lastEvidenceDate;

    private Instant nextReviewDate;

    private UUID assignedTo;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public enum ControlStatus {
        NOT_STARTED, IN_PROGRESS, EVIDENCE_COLLECTED, AUDITOR_REVIEWED, COMPLIANT, NON_COMPLIANT
    }
}
