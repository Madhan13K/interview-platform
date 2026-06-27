package com.interview_platform_backend.interview_platform_backend.report.dto;

import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ReportTemplateResponse {
    private UUID id;
    private String name;
    private String description;
    private String entityType;
    private String columns;
    private String filters;
    private String groupBy;
    private String sortBy;
    private String sortDirection;
    private String aggregations;
    private String chartType;
    private Boolean isPublic;
    private String createdByEmail;
    private UUID organizationId;
    private Instant createdAt;
    private Instant updatedAt;
}
