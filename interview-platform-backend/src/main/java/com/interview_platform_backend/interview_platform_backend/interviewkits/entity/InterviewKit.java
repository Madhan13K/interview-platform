package com.interview_platform_backend.interview_platform_backend.interviewkits.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "interview_kits")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewKit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String roleType;

    @Column(nullable = false)
    private String interviewType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String rubric;

    @Column(columnDefinition = "TEXT")
    private String questions;

    @Column(columnDefinition = "TEXT")
    private String scoringCriteria;

    private int duration;

    @Column(nullable = false)
    private UUID createdBy;

    @Builder.Default
    private boolean isPublished = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
