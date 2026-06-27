package com.interview_platform_backend.interview_platform_backend.asyncinterview.dto;

import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AsyncInterviewResponseDto {

    private UUID id;
    private String title;
    private String description;
    private UUID organizationId;
    private UUID createdById;
    private String createdByName;
    private Instant deadline;
    private Integer maxResponseTime;
    private Integer maxRetakes;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;
    private Integer questionCount;
    private Integer invitationCount;
    private List<QuestionDto> questions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionDto {
        private UUID id;
        private String questionText;
        private Integer questionOrder;
        private Integer thinkingTime;
        private Integer maxResponseTime;
        private Boolean required;
    }
}
