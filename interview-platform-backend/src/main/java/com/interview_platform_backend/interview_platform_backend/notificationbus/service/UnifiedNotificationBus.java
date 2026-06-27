package com.interview_platform_backend.interview_platform_backend.notificationbus.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;

/**
 * Unified Notification Bus.
 * Consolidates Email, SMS, Push, In-App, Slack, Teams into a single event-driven bus.
 * Replaces the previous pattern of 3 separate dispatch mechanisms:
 * 1. Direct service calls (EmailNotificationService, SmsNotificationService)
 * 2. Kafka async (NotificationProducer/Consumer)
 * 3. Spring events (InterviewEventListener)
 *
 * Now: All notifications flow through this single bus which routes to appropriate channels.
 */
@Service
public class UnifiedNotificationBus {

    private static final Logger log = LoggerFactory.getLogger(UnifiedNotificationBus.class);

    @Value("${app.notifications.enabled:true}")
    private boolean enabled;

    private final Queue<NotificationMessage> queue = new ConcurrentLinkedQueue<>();
    private final List<NotificationHandler> handlers = new ArrayList<>();

    public void registerHandler(NotificationHandler handler) {
        handlers.add(handler);
        log.info("Registered notification handler: {}", handler.getChannel());
    }

    @Async("asyncTaskExecutor")
    public void publish(NotificationMessage message) {
        if (!enabled) {
            log.debug("Notifications disabled, dropping message: {}", message.getType());
            return;
        }

        log.info("Publishing notification: type={}, channels={}, recipient={}",
                message.getType(), message.getChannels(), message.getRecipientId());

        for (String channel : message.getChannels()) {
            handlers.stream()
                    .filter(h -> h.getChannel().equalsIgnoreCase(channel))
                    .findFirst()
                    .ifPresentOrElse(
                            h -> {
                                try {
                                    h.send(message);
                                    log.debug("Notification sent via {}: {}", channel, message.getType());
                                } catch (Exception e) {
                                    log.error("Failed to send via {}: {}", channel, e.getMessage());
                                    queue.add(message); // Re-queue for retry
                                }
                            },
                            () -> log.warn("No handler registered for channel: {}", channel)
                    );
        }
    }

    public void publishToAll(String type, UUID recipientId, String title, String body, Map<String, Object> metadata) {
        publish(NotificationMessage.builder()
                .id(UUID.randomUUID())
                .type(type)
                .recipientId(recipientId)
                .title(title)
                .body(body)
                .channels(List.of("EMAIL", "IN_APP", "PUSH"))
                .metadata(metadata != null ? metadata : Map.of())
                .createdAt(Instant.now())
                .build());
    }

    public int getPendingCount() { return queue.size(); }

    public Map<String, Object> getStats() {
        return Map.of(
                "enabled", enabled,
                "registeredHandlers", handlers.stream().map(NotificationHandler::getChannel).toList(),
                "pendingRetries", queue.size()
        );
    }

    public interface NotificationHandler {
        String getChannel();
        void send(NotificationMessage message);
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class NotificationMessage {
        private UUID id;
        private String type;
        private UUID recipientId;
        private String title;
        private String body;
        private List<String> channels;
        private Map<String, Object> metadata;
        private Instant createdAt;
    }
}
