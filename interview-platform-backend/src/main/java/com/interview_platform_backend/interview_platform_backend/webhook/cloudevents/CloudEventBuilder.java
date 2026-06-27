package com.interview_platform_backend.interview_platform_backend.webhook.cloudevents;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Builds CloudEvents 1.0 compliant event envelopes.
 * Spec: https://cloudevents.io/
 *
 * CloudEvents provides a standard way to describe events regardless of
 * the event source or consumer. This enables interoperability across
 * webhook consumers (Zapier, AWS EventBridge, Azure Event Grid, etc.)
 */
public class CloudEventBuilder {

    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    private static final String SPEC_VERSION = "1.0";
    private static final String SOURCE = "https://interview-platform.com";

    /**
     * Build a CloudEvent envelope for a webhook payload.
     *
     * @param eventType The event type (e.g., "com.interview-platform.interview.scheduled")
     * @param subject   The subject (e.g., interview ID)
     * @param data      The event payload
     * @return CloudEvent JSON as a Map
     */
    public static Map<String, Object> build(String eventType, String subject, Object data) {
        Map<String, Object> event = new LinkedHashMap<>();

        // Required attributes (CloudEvents spec)
        event.put("specversion", SPEC_VERSION);
        event.put("id", UUID.randomUUID().toString());
        event.put("source", SOURCE);
        event.put("type", eventType);
        event.put("time", Instant.now().toString());

        // Optional attributes
        event.put("subject", subject);
        event.put("datacontenttype", "application/json");

        // Data payload
        event.put("data", data);

        // Extension attributes (platform-specific)
        event.put("interviewplatformversion", "2.0.0");

        return event;
    }

    /**
     * Convert to JSON string.
     */
    public static String toJson(Map<String, Object> cloudEvent) {
        try {
            return objectMapper.writeValueAsString(cloudEvent);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize CloudEvent", e);
        }
    }

    /**
     * Build event type string following CloudEvents naming convention.
     * Format: com.interview-platform.{domain}.{action}
     */
    public static String eventType(String domain, String action) {
        return "com.interview-platform." + domain + "." + action;
    }
}
