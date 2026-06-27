package com.interview_platform_backend.interview_platform_backend.report.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ReportTemplateRequest {
    @NotBlank private String name;
    private String description;
    @NotBlank private String entityType;
    @NotNull private String columns;    // JSON string
    private String filters;             // JSON string
    private String groupBy;
    private String sortBy;
    private String sortDirection;
    private String aggregations;        // JSON string
    private String chartType;
    private Boolean isPublic;
}
