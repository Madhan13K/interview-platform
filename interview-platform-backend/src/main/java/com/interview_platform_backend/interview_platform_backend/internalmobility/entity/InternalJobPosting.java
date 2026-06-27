package com.interview_platform_backend.interview_platform_backend.internalmobility.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "internal_job_postings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalJobPosting {

    public enum Status {
        OPEN, CLOSED, FILLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private UUID managerId;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(columnDefinition = "TEXT")
    private String eligibilityCriteria;

    @Builder.Default
    private int applicantCount = 0;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant closedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (status == null) {
            status = Status.OPEN;
        }
    }
}
