package com.interview_platform_backend.interview_platform_backend.nps.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "nps_surveys")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NpsSurvey {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID interviewId;

    @Column(nullable = false)
    private UUID candidateId;

    @Column(nullable = false)
    private int score;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private NpsCategory category = NpsCategory.PASSIVE;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private Instant sentAt;

    private Instant respondedAt;

    private String stage;

    @Column(nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum NpsCategory {
        PROMOTER,
        PASSIVE,
        DETRACTOR
    }

    @PrePersist
    @PreUpdate
    private void calculateCategory() {
        if (score >= 9) {
            this.category = NpsCategory.PROMOTER;
        } else if (score >= 7) {
            this.category = NpsCategory.PASSIVE;
        } else {
            this.category = NpsCategory.DETRACTOR;
        }
    }
}
