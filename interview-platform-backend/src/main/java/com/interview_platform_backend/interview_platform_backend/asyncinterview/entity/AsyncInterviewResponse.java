package com.interview_platform_backend.interview_platform_backend.asyncinterview.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "async_interview_responses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AsyncInterviewResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invitation_id", nullable = false)
    private AsyncInterviewInvitation invitation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private AsyncInterviewQuestion question;

    @Column(name = "video_s3_key", nullable = false, length = 1000)
    private String videoS3Key;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "retake_number")
    @Builder.Default
    private Integer retakeNumber = 1;

    @Column(columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "ai_score", precision = 3, scale = 1)
    private BigDecimal aiScore;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
