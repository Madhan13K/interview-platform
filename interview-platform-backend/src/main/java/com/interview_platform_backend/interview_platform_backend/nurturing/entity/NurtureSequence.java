package com.interview_platform_backend.interview_platform_backend.nurturing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "nurture_sequences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NurtureSequence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private UUID organizationId;

    private String targetSegment;

    @Column(columnDefinition = "TEXT")
    private String steps;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SequenceStatus status = SequenceStatus.DRAFT;

    @Builder.Default
    private int enrolledCount = 0;

    @Builder.Default
    private int completedCount = 0;

    @Builder.Default
    private double openRate = 0.0;

    @Builder.Default
    private double clickRate = 0.0;

    private UUID createdBy;

    @Column(nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public enum SequenceStatus {
        DRAFT,
        ACTIVE,
        PAUSED,
        COMPLETED
    }
}
