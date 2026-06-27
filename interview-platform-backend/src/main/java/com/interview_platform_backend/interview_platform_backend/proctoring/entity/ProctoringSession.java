package com.interview_platform_backend.interview_platform_backend.proctoring.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "proctoring_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProctoringSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "interview_id", nullable = false)
    private UUID interviewId;

    @Column(name = "candidate_id", nullable = false)
    private UUID candidateId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ProctoringStatus status = ProctoringStatus.MONITORING;

    @Column(name = "tab_switch_count", nullable = false)
    @Builder.Default
    private int tabSwitchCount = 0;

    @Column(name = "face_count_violations", nullable = false)
    @Builder.Default
    private int faceCountViolations = 0;

    @Column(name = "suspicious_events", columnDefinition = "TEXT")
    private String suspiciousEvents;

    @Column(name = "screen_recording_consent", nullable = false)
    @Builder.Default
    private boolean screenRecordingConsent = false;

    @Column(name = "screen_recording_url")
    private String screenRecordingUrl;

    @Column(name = "integrity_score", nullable = false)
    @Builder.Default
    private double integrityScore = 100.0;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @PrePersist
    protected void onCreate() {
        startedAt = Instant.now();
    }

    public enum ProctoringStatus {
        MONITORING, COMPLETED, FLAGGED
    }
}
