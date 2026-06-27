package com.interview_platform_backend.interview_platform_backend.aisummarizer.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "interview_summaries_v2")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSummaryV2 {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID interviewId;

    @Column(nullable = false)
    @Builder.Default
    private String generatedBy = "AI";

    @Column(columnDefinition = "TEXT")
    private String attendees;

    @Column(columnDefinition = "TEXT")
    private String keyDiscussionPoints;

    @Column(columnDefinition = "TEXT")
    private String actionItems;

    @Column(columnDefinition = "TEXT")
    private String decisions;

    @Column(nullable = false)
    @Builder.Default
    private boolean followUpRequired = false;

    @Column(columnDefinition = "TEXT")
    private String nextSteps;

    private String overallSentiment;

    private int duration;

    @Column(columnDefinition = "TEXT")
    private String distributedTo;

    private Instant distributedAt;

    @Column(nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
