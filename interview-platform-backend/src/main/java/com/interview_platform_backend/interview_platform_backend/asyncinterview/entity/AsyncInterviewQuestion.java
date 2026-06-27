package com.interview_platform_backend.interview_platform_backend.asyncinterview.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "async_interview_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AsyncInterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "async_interview_id", nullable = false)
    private AsyncInterview asyncInterview;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "question_order", nullable = false)
    private Integer questionOrder;

    @Column(name = "thinking_time")
    @Builder.Default
    private Integer thinkingTime = 30;

    @Column(name = "max_response_time")
    @Builder.Default
    private Integer maxResponseTime = 120;

    @Column(nullable = false)
    @Builder.Default
    private Boolean required = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
