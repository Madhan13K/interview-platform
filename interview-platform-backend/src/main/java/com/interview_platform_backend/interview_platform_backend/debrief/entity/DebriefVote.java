package com.interview_platform_backend.interview_platform_backend.debrief.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "debrief_votes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebriefVote {

    public enum Recommendation {
        STRONG_HIRE, HIRE, NO_HIRE, STRONG_NO_HIRE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID sessionId;

    @Column(nullable = false)
    private UUID participantId;

    @Column(nullable = false)
    private int rating;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Recommendation recommendation;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private Instant submittedAt;

    @PrePersist
    protected void onCreate() {
        if (submittedAt == null) {
            submittedAt = Instant.now();
        }
    }
}
