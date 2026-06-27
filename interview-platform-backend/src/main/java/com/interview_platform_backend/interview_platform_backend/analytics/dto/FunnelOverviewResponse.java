package com.interview_platform_backend.interview_platform_backend.analytics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FunnelOverviewResponse {

    private Integer totalCandidates;
    private Integer totalHired;
    private Integer totalRejected;
    private Integer totalWithdrawn;
    private BigDecimal overallConversion;
    private BigDecimal avgTimeToHire;
    private List<StageCount> stageBreakdown;
    private Map<String, BigDecimal> conversionRates;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StageCount {
        private String stageName;
        private Integer count;
    }
}
