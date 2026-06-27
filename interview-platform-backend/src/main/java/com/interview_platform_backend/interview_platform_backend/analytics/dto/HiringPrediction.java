package com.interview_platform_backend.interview_platform_backend.analytics.dto;

import lombok.*;
import java.util.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HiringPrediction {
    private UUID candidateId;
    private double successProbability;
    private String recommendation;      // STRONG_HIRE, HIRE, NEEDS_MORE_INTERVIEWS, NO_HIRE
    private double confidence;
    private Map<String, Double> features;
    private List<String> topFactors;
    private int predictedTimeToOffer;   // days
}
