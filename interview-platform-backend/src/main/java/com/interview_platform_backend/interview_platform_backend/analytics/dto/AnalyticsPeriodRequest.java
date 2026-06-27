package com.interview_platform_backend.interview_platform_backend.analytics.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsPeriodRequest {

    private UUID organizationId;

    private UUID pipelineId;

    @NotNull(message = "Period type is required")
    private String periodType; // DAILY, WEEKLY, MONTHLY

    private LocalDate startDate;

    private LocalDate endDate;
}
