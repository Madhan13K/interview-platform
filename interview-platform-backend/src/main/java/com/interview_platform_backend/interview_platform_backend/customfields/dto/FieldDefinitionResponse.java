package com.interview_platform_backend.interview_platform_backend.customfields.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldDefinitionResponse {

    private UUID id;
    private UUID organizationId;
    private String entityType;
    private String fieldName;
    private String fieldKey;
    private String fieldType;
    private String description;
    private Boolean isRequired;
    private String defaultValue;
    private List<String> options;
    private String validationRegex;
    private Integer displayOrder;
    private Boolean isActive;
    private Instant createdAt;
}
