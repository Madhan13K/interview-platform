package com.interview_platform_backend.interview_platform_backend.customfields.dto;

import lombok.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldDefinitionRequest {

    @NotBlank(message = "Field name is required")
    private String fieldName;

    @NotBlank(message = "Field key is required")
    private String fieldKey;

    @NotNull(message = "Field type is required")
    private String fieldType;

    @NotBlank(message = "Entity type is required")
    private String entityType;

    private String description;

    private Boolean isRequired;

    private String defaultValue;

    private List<String> options;

    private String validationRegex;
}
