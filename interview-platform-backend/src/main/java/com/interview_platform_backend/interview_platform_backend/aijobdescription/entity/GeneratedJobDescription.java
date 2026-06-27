package com.interview_platform_backend.interview_platform_backend.aijobdescription.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "generated_job_descriptions", indexes = {
        @Index(name = "idx_gen_jd_title", columnList = "jobTitle"),
        @Index(name = "idx_gen_jd_status", columnList = "status"),
        @Index(name = "idx_gen_jd_department", columnList = "department")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeneratedJobDescription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String jobTitle;

    @Column(nullable = false)
    private String department;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String generatedContent;

    @Column(nullable = false)
    @Builder.Default
    private double deiScore = 0.0;

    @Column(columnDefinition = "TEXT")
    private String inclusiveLanguageFlags;

    private String toneAnalysis;

    @Column(nullable = false)
    @Builder.Default
    private double readabilityScore = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private int wordCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column(nullable = false)
    private Instant generatedAt;

    private UUID approvedBy;

    @PrePersist
    protected void onCreate() {
        if (this.generatedAt == null) {
            this.generatedAt = Instant.now();
        }
    }

    public enum Status {
        DRAFT,
        REVIEWED,
        APPROVED,
        PUBLISHED
    }
}
