package com.interview_platform_backend.interview_platform_backend.customfields.dto;

import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FieldValueResponse {

    private String fieldKey;
    private String fieldName;
    private String fieldType;
    private Object value;
    private UUID entityId;
}
