package com.interview_platform_backend.interview_platform_backend.report.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GenerateReportRequest {
    @NotNull private UUID templateId;
    private String format;  // PDF, EXCEL, CSV (defaults to PDF)
    private String filters; // Override template filters (optional JSON)
}
