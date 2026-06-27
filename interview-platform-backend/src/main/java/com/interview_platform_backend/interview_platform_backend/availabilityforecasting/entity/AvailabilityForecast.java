package com.interview_platform_backend.interview_platform_backend.availabilityforecasting.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "availability_forecasts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvailabilityForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID interviewerId;

    @Column(nullable = false)
    private LocalDate forecastDate;

    private int predictedAvailableSlots;

    private double conflictProbability;

    @Column(columnDefinition = "TEXT")
    private String busyHours;

    @Column(columnDefinition = "TEXT")
    private String recommendedSlots;

    private Instant generatedAt;

    @PrePersist
    protected void onCreate() {
        generatedAt = Instant.now();
    }
}
