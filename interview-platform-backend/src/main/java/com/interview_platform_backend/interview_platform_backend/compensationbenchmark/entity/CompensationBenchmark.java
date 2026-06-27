package com.interview_platform_backend.interview_platform_backend.compensationbenchmark.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "compensation_benchmarks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompensationBenchmark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String roleTitle;

    @Column(nullable = false)
    private String level;

    @Column(nullable = false)
    private String location;

    @Builder.Default
    @Column(nullable = false)
    private String currency = "USD";

    private double p25;

    private double p50;

    private double p75;

    private double p90;

    private double totalComp;

    private double equity;

    private double bonus;

    private String dataSource;

    private Instant lastUpdated;

    @PrePersist
    protected void onCreate() {
        lastUpdated = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdated = Instant.now();
    }
}
