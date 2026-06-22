package com.interview_platform_backend.interview_platform_backend.messaging.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data @Builder
public class ConversationResponse {
    private UUID id;
    private String title;
    private String type;
    private List<ParticipantInfo> participants;
    private MessageResponse lastMessage;
    private long unreadCount;
    private Instant createdAt;
    private Instant updatedAt;

    @Data @Builder
    public static class ParticipantInfo {
        private UUID id;
        private String firstName;
        private String lastName;
        private String email;
    }
}
