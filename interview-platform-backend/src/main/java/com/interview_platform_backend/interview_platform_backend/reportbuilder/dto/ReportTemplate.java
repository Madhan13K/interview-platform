package com.interview_platform_backend.interview_platform_backend.reportbuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportTemplate {

    private UUID id;
    private String name;
    private String description;
    private List<ReportWidget> widgets;
    private String layout; // "grid" or "list"
    private List<Map<String, Object>> filters;
    private String schedule; // cron expression
    private UUID createdBy;
    private Instant lastGenerated;
}
