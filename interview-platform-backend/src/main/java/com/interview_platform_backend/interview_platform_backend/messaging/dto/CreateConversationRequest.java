package com.interview_platform_backend.interview_platform_backend.messaging.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.Set;
import java.util.UUID;

@Data
public class CreateConversationRequest {
    private String title;
    @NotEmpty(message = "At least one participant is required")
    private Set<UUID> participantIds;
    private String type; // DIRECT or GROUP
}
