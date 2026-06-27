package com.interview_platform_backend.interview_platform_backend.asyncinterview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmitResponseRequest {

    @NotNull(message = "Question ID is required")
    private UUID questionId;

    @NotBlank(message = "Video S3 key is required")
    private String videoS3Key;

    private Integer durationSeconds;
}
