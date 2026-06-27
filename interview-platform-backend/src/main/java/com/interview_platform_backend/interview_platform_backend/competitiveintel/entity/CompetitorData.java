package com.interview_platform_backend.interview_platform_backend.competitiveintel.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "competitor_data", indexes = {
        @Index(name = "idx_competitor_data_name", columnList = "competitorName"),
        @Index(name = "idx_competitor_data_type", columnList = "dataType"),
        @Index(name = "idx_competitor_data_role", columnList = "role")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompetitorData {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String competitorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DataType dataType;

    private String role;

    private String location;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String value;

    @Column(nullable = false)
    private String source;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConfidenceLevel confidence;

    @Column(nullable = false)
    private Instant collectedAt;

    private Instant expiresAt;

    public enum DataType {
        SALARY_RANGE,
        TIME_TO_FILL,
        HIRING_VOLUME,
        TECH_STACK,
        BENEFITS,
        GLASSDOOR_RATING
    }

    public enum ConfidenceLevel {
        HIGH,
        MEDIUM,
        LOW
    }
}
