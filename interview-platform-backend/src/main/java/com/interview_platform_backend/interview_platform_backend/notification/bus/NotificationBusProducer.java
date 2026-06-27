package com.interview_platform_backend.interview_platform_backend.notification.bus;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Publishes notification events to the unified notification bus (Kafka topic).
 * This is the ONLY entry point for all notifications in the system.
 *
 * Usage:
 *   notificationBus.publish(NotificationEvent.builder()
 *       .eventType("INTERVIEW_SCHEDULED")
 *       .channels(List.of(Channel.EMAIL, Channel.IN_APP, Channel.PUSH))
 *       .recipientEmail("user@acme.com")
 *       .subject("Interview Scheduled")
 *       .body("Your interview has been scheduled...")
 *       .build());
 */
@Service
public class NotificationBusProducer {

    private static final Logger log = LoggerFactory.getLogger(NotificationBusProducer.class);
    private static final String TOPIC = "notification-bus";

    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private KafkaTemplate<String, String> kafkaTemplate;

    public NotificationBusProducer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void publish(NotificationEvent event) {
        if (event.getEventId() == null) {
            event.setEventId(UUID.randomUUID().toString());
        }
        if (event.getTimestamp() == null) {
            event.setTimestamp(Instant.now());
        }

        try {
            String payload = objectMapper.writeValueAsString(event);
            String key = event.getRecipientEmail() != null ? event.getRecipientEmail() : event.getEventId();

            if (kafkaTemplate != null) {
                kafkaTemplate.send(TOPIC, key, payload)
                        .whenComplete((result, ex) -> {
                            if (ex != null) {
                                log.error("Failed to publish to notification-bus: {}", ex.getMessage());
                            } else {
                                log.debug("Published to notification-bus: {} → {}", event.getEventType(), event.getRecipientEmail());
                            }
                        });
            } else {
                log.info("[notification-bus] Kafka disabled. Event: type={}, to={}, channels={}",
                        event.getEventType(), event.getRecipientEmail(), event.getChannels());
            }
        } catch (Exception e) {
            log.error("Failed to serialize notification event: {}", e.getMessage());
        }
    }
}
