package com.interview_platform_backend.interview_platform_backend.search.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchRequest {
    private String query;
    private String status;
    private String type;
    private String organizationId;
    @Builder.Default
    private int page = 0;
    @Builder.Default
    private int size = 20;
}
