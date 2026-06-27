package com.interview_platform_backend.interview_platform_backend.smartschedulingv2.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "scheduling_preferences_v2", indexes = {
        @Index(name = "idx_scheduling_prefs_v2_interviewer", columnList = "interviewerId")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchedulingPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID interviewerId;

    @Column(columnDefinition = "TEXT")
    private String preferredHours;

    @Column(nullable = false)
    @Builder.Default
    private int maxInterviewsPerDay = 4;

    @Column(nullable = false)
    @Builder.Default
    private int fatigueCooldownMinutes = 30;

    @Column(nullable = false)
    private String timezone;

    @Column(columnDefinition = "TEXT")
    private String noShowHistory;

    @Column(columnDefinition = "TEXT")
    private String performanceByTimeSlot;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
