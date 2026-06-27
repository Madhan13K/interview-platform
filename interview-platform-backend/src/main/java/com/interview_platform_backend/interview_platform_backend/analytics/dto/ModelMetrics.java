package com.interview_platform_backend.interview_platform_backend.analytics.dto;

import lombok.*;
import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModelMetrics {
    private String modelVersion;
    private String algorithm;
    private double accuracy;
    private double precision;
    private double recall;
    private double f1Score;
    private long trainingDataSize;
    private Instant lastTrainedAt;
    private List<String> features;
}
