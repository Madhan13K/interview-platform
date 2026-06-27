package com.interview_platform_backend.interview_platform_backend.campusrecruiting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "campus_events", indexes = {
        @Index(name = "idx_campus_events_university", columnList = "universityName"),
        @Index(name = "idx_campus_events_status", columnList = "status"),
        @Index(name = "idx_campus_events_date", columnList = "eventDate")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampusEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String universityName;

    @Column(nullable = false)
    private Instant eventDate;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private UUID coordinatorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status;

    @Column(nullable = false)
    private int maxCandidates;

    @Column(nullable = false)
    @Builder.Default
    private int registeredCount = 0;

    private String cohortTag;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum EventStatus {
        PLANNED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
