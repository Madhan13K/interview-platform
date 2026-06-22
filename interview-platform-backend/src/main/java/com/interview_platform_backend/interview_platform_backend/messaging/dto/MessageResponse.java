package com.interview_platform_backend.interview_platform_backend.messaging.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data @Builder
public class MessageResponse {
    private UUID id;
    private UUID conversationId;
    private UUID senderId;
    private String senderName;
    private String content;
    private String type;
    private UUID parentMessageId;
    private Boolean isEdited;
    private Instant createdAt;
}
