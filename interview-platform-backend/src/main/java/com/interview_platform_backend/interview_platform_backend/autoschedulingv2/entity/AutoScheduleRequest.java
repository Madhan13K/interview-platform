package com.interview_platform_backend.interview_platform_backend.autoschedulingv2.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "auto_schedule_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoScheduleRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "interview_id", nullable = false)
    private UUID interviewId;

    @Column(name = "candidate_id", nullable = false)
    private UUID candidateId;

    @Column(name = "interviewer_ids", columnDefinition = "TEXT", nullable = false)
    private String interviewerIds;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private AutoScheduleStatus status = AutoScheduleStatus.PENDING;

    @Column(name = "proposed_slot")
    private Instant proposedSlot;

    @Column(name = "confirmed_slot")
    private Instant confirmedSlot;

    @Column(name = "auto_confirmed", nullable = false)
    @Builder.Default
    private boolean autoConfirmed = false;

    @Column(name = "conflict_detected", nullable = false)
    @Builder.Default
    private boolean conflictDetected = false;

    @Column(name = "reschedule_count", nullable = false)
    @Builder.Default
    private int rescheduleCount = 0;

    @Column(name = "ai_reasoning", columnDefinition = "TEXT")
    private String aiReasoning;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public enum AutoScheduleStatus {
        PENDING, PROPOSED, CONFIRMED, FAILED, RESCHEDULED
    }
}
