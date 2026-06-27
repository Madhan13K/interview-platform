package com.interview_platform_backend.interview_platform_backend.bulk.dto;

import lombok.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkUpdateRequest {

    @NotBlank(message = "Entity type is required")
    private String entityType;

    @NotEmpty(message = "Items list cannot be empty")
    private List<Map<String, Object>> items;
}
