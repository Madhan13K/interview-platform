package com.interview_platform_backend.interview_platform_backend.analytics.dto;

import lombok.*;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewerMatchRequest {

    @NotNull(message = "Candidate ID is required")
    private UUID candidateId;

    @NotEmpty(message = "Interviewer IDs list cannot be empty")
    private List<UUID> interviewerIds;
}
