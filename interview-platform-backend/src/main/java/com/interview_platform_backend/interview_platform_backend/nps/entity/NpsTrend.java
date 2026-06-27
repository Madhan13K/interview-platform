package com.interview_platform_backend.interview_platform_backend.nps.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "nps_trends")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NpsTrend {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private String period;

    private int promoterCount;

    private int passiveCount;

    private int detractorCount;

    private double npsScore;

    private double responseRate;

    private int sampleSize;

    private double correlationToOfferAcceptance;

    @Column(nullable = false)
    @Builder.Default
    private Instant calculatedAt = Instant.now();
}
