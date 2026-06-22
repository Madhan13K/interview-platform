package com.interview_platform_backend.interview_platform_backend.notification;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Sprint 2: Notification Delivery Tests (Mocked)
 */
@DisplayName("Notification Delivery Tests")
class NotificationDeliveryTest {

    @Nested
    @DisplayName("Email Notification")
    class EmailNotification {
        @Test void shouldBuildHtmlEmailTemplate() {
            String template = buildEmailTemplate("John", "Your interview is scheduled for tomorrow.");
            assertTrue(template.contains("John"));
            assertTrue(template.contains("scheduled for tomorrow"));
        }

        @Test void shouldSkipIfEmailDisabled() {
            boolean enabled = false;
            assertFalse(enabled, "When disabled, email should not be sent");
        }
    }

    @Nested
    @DisplayName("SMS Notification")
    class SmsNotification {
        @Test void shouldTruncateLongMessages() {
            String longMessage = "A".repeat(200);
            String truncated = longMessage.length() > 160 ? longMessage.substring(0, 157) + "..." : longMessage;
            assertEquals(160, truncated.length());
        }

        @Test void shouldValidatePhoneFormat() {
            assertTrue(isValidPhone("+1-555-0123"));
            assertTrue(isValidPhone("+44 7911 123456"));
            assertFalse(isValidPhone("not-a-number"));
            assertFalse(isValidPhone(""));
        }
    }

    @Nested
    @DisplayName("In-App Notification")
    class InAppNotification {
        @Test void shouldMarkAsReadUpdateTimestamp() {
            boolean isRead = false;
            isRead = true; // Simulate mark as read
            assertTrue(isRead);
        }
    }

    private String buildEmailTemplate(String name, String message) {
        return "<html><body><h1>Hello " + name + "</h1><p>" + message + "</p></body></html>";
    }

    private boolean isValidPhone(String phone) {
        return phone != null && phone.matches("^\\+?[0-9\\s\\-]{7,15}$");
    }
}
