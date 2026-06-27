package com.interview_platform_backend.interview_platform_backend.asyncinterview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AsyncInterviewRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Questions are required")
    private List<QuestionItem> questions;

    private Instant deadline;

    private Integer maxResponseTime;

    private Integer maxRetakes;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionItem {
        @NotBlank(message = "Question text is required")
        private String questionText;
        private Integer thinkingTime;
        private Integer maxResponseTime;
        private Boolean required;
    }
}
