package com.interview_platform_backend.interview_platform_backend.workflowbuilder.dto;

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
public class WorkflowCanvas {

    private UUID id;
    private String name;
    private String description;
    private List<WorkflowNode> nodes;
    private List<Map<String, String>> edges;
    private boolean isPublished;
    private int version;
    private Instant lastModified;
}
