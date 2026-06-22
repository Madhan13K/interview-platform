package com.interview_platform_backend.interview_platform_backend.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
public class SendMessageRequest {
    @NotBlank(message = "Message content is required")
    private String content;
    private String type; // TEXT, FILE, SYSTEM
    private UUID parentMessageId; // For threaded replies
}
