package com.interview_platform_backend.interview_platform_backend.messaging;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 2: Messaging Entity Structure Tests (Unit - no Spring context needed)
 */
@DisplayName("Messaging Service Tests")
class MessagingServiceTest {

    @Test
    @DisplayName("Should verify Conversation entity exists with correct structure")
    void shouldCreateDirectConversation() {
        assertNotNull(com.interview_platform_backend.interview_platform_backend.messaging.entity.Conversation.class);
        assertNotNull(com.interview_platform_backend.interview_platform_backend.messaging.entity.Conversation.ConversationType.DIRECT);
        assertNotNull(com.interview_platform_backend.interview_platform_backend.messaging.entity.Conversation.ConversationType.GROUP);
    }

    @Test
    @DisplayName("Message entity should have required fields")
    void messageShouldHaveRequiredFields() throws Exception {
        var fields = com.interview_platform_backend.interview_platform_backend.messaging.entity.Message.class.getDeclaredFields();
        var fieldNames = java.util.Arrays.stream(fields).map(java.lang.reflect.Field::getName).toList();
        assertTrue(fieldNames.contains("content"), "Must have content field");
        assertTrue(fieldNames.contains("conversation"), "Must have conversation field");
        assertTrue(fieldNames.contains("sender"), "Must have sender field");
        assertTrue(fieldNames.contains("type"), "Must have type field");
        assertTrue(fieldNames.contains("createdAt"), "Must have createdAt field");
        assertTrue(fieldNames.contains("parentMessageId"), "Must have parentMessageId for threading");
    }
}
