package com.interview_platform_backend.interview_platform_backend.bulk.dto;

import lombok.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkDeleteRequest {

    @NotBlank(message = "Entity type is required")
    private String entityType;

    @NotEmpty(message = "IDs list cannot be empty")
    private List<UUID> ids;
}
