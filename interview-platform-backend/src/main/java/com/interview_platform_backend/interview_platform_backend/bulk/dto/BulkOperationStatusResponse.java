package com.interview_platform_backend.interview_platform_backend.bulk.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkOperationStatusResponse {

    private UUID id;
    private String status;
    private String operationType;
    private String entityType;
    private Integer totalItems;
    private Integer processedItems;
    private Integer successCount;
    private Integer failureCount;
    private Object errors;
}
