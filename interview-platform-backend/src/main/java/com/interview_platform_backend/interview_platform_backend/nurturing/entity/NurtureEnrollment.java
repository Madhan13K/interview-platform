package com.interview_platform_backend.interview_platform_backend.nurturing.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "nurture_enrollments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NurtureEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID sequenceId;

    @Column(nullable = false)
    private UUID candidateId;

    @Builder.Default
    private int currentStep = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    @Column(nullable = false)
    @Builder.Default
    private Instant enrolledAt = Instant.now();

    private Instant lastStepAt;

    private Instant nextStepAt;

    public enum EnrollmentStatus {
        ACTIVE,
        COMPLETED,
        UNSUBSCRIBED,
        BOUNCED
    }
}
