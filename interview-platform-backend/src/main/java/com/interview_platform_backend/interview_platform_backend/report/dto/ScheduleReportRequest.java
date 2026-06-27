package com.interview_platform_backend.interview_platform_backend.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.List;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ScheduleReportRequest {
    @NotNull private UUID templateId;
    @NotBlank private String cronExpression;
    private String format;
    @NotNull private List<String> recipients;
}
