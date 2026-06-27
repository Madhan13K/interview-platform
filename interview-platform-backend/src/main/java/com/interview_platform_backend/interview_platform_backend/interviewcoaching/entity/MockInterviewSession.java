package com.interview_platform_backend.interview_platform_backend.interviewcoaching.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "mock_interview_sessions", indexes = {
        @Index(name = "idx_mock_sessions_candidate", columnList = "candidateId"),
        @Index(name = "idx_mock_sessions_status", columnList = "status"),
        @Index(name = "idx_mock_sessions_type", columnList = "interviewType")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MockInterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID candidateId;

    @Column(nullable = false)
    private String jobTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewType interviewType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionStatus status = SessionStatus.CREATED;

    @Column(nullable = false)
    @Builder.Default
    private int questionsAsked = 0;

    @Column(nullable = false)
    @Builder.Default
    private double avgScore = 0.0;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String improvements;

    @Builder.Default
    private int duration = 0;

    private Instant startedAt;

    private Instant completedAt;

    public enum InterviewType {
        TECHNICAL,
        BEHAVIORAL,
        SYSTEM_DESIGN,
        CASE_STUDY
    }

    public enum SessionStatus {
        CREATED,
        IN_PROGRESS,
        COMPLETED
    }
}
