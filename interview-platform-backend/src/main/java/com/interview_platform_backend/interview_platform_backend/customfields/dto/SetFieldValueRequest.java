package com.interview_platform_backend.interview_platform_backend.customfields.dto;

import lombok.*;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SetFieldValueRequest {

    @NotNull(message = "Field definition ID is required")
    private UUID fieldDefinitionId;

    @NotNull(message = "Entity ID is required")
    private UUID entityId;

    @NotNull(message = "Entity type is required")
    private String entityType;

    private Object value;
}
