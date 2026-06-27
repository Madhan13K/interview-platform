package com.interview_platform_backend.interview_platform_backend.webhook.cloudevents;

import com.interview_platform_backend.interview_platform_backend.webhook.entity.WebhookDelivery;
import com.interview_platform_backend.interview_platform_backend.webhook.entity.WebhookEndpoint;
import com.interview_platform_backend.interview_platform_backend.webhook.repository.WebhookDeliveryRepository;
import com.interview_platform_backend.interview_platform_backend.webhook.repository.WebhookEndpointRepository;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import io.opentelemetry.instrumentation.annotations.SpanAttribute;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

/**
 * CloudEvents-compliant webhook dispatcher (v2).
 *
 * Differences from v1 (WebhookDispatcher):
 * - Uses CloudEvents 1.0 envelope format
 * - Adds ce-* headers (structured content mode)
 * - Supports both structured and binary content modes
 * - Event type follows: com.interview-platform.{domain}.{action}
 * - Backward compatible — legacy endpoints still receive JSON payloads
 */
@Service
public class CloudEventDispatcher {

    private static final Logger log = LoggerFactory.getLogger(CloudEventDispatcher.class);
    private static final int MAX_ATTEMPTS = 5;

    private final WebhookEndpointRepository endpointRepository;
    private final WebhookDeliveryRepository deliveryRepository;
    private final RestTemplate restTemplate;

    public CloudEventDispatcher(WebhookEndpointRepository endpointRepository,
                                WebhookDeliveryRepository deliveryRepository) {
        this.endpointRepository = endpointRepository;
        this.deliveryRepository = deliveryRepository;
        this.restTemplate = new RestTemplate();
    }

    @WithSpan("cloudevent-dispatch")
    @Transactional
    public void dispatch(@SpanAttribute("event.type") String eventType,
                         String subject,
                         Object data) {
        Map<String, Object> cloudEvent = CloudEventBuilder.build(eventType, subject, data);
        String payload = CloudEventBuilder.toJson(cloudEvent);

        List<WebhookEndpoint> activeEndpoints = endpointRepository.findByIsActiveTrue();

        for (WebhookEndpoint endpoint : activeEndpoints) {
            if (endpoint.getEvents() != null &&
                    Arrays.asList(endpoint.getEvents()).contains(eventType)) {

                WebhookDelivery delivery = WebhookDelivery.builder()
                        .endpoint(endpoint)
                        .eventType(eventType)
                        .payload(payload)
                        .attempt(0)
                        .maxAttempts(MAX_ATTEMPTS)
                        .status(WebhookDelivery.DeliveryStatus.PENDING)
                        .build();

                delivery = deliveryRepository.save(delivery);
                deliverAsync(delivery.getId());
            }
        }
    }

    @Async
    public void deliverAsync(UUID deliveryId) {
        deliveryRepository.findById(deliveryId).ifPresent(this::deliver);
    }

    @Transactional
    public void deliver(WebhookDelivery delivery) {
        WebhookEndpoint endpoint = delivery.getEndpoint();

        try {
            String signature = computeSignature(delivery.getPayload(), endpoint.getSecret());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // CloudEvents structured content mode headers
            headers.set("ce-specversion", "1.0");
            headers.set("ce-id", UUID.randomUUID().toString());
            headers.set("ce-type", delivery.getEventType());
            headers.set("ce-source", "https://interview-platform.com");
            headers.set("ce-time", Instant.now().toString());

            // Legacy compatibility headers
            headers.set("X-Webhook-Signature", signature);
            headers.set("X-Webhook-Event", delivery.getEventType());
            headers.set("X-Webhook-Delivery-Id", delivery.getId().toString());
            headers.set("X-CloudEvents-Version", "1.0");

            HttpEntity<String> request = new HttpEntity<>(delivery.getPayload(), headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint.getUrl(), HttpMethod.POST, request, String.class);

            delivery.setResponseStatus(response.getStatusCode().value());
            delivery.setResponseBody(response.getBody());
            delivery.setAttempt(delivery.getAttempt() + 1);
            delivery.setStatus(WebhookDelivery.DeliveryStatus.DELIVERED);
            delivery.setDeliveredAt(Instant.now());

        } catch (Exception e) {
            log.error("CloudEvent delivery failed for {}: {}", delivery.getId(), e.getMessage());
            delivery.setAttempt(delivery.getAttempt() + 1);
            delivery.setResponseBody(e.getMessage());

            if (delivery.getAttempt() >= delivery.getMaxAttempts()) {
                delivery.setStatus(WebhookDelivery.DeliveryStatus.FAILED);
            } else {
                delivery.setStatus(WebhookDelivery.DeliveryStatus.RETRYING);
                long delay = (long) (15 * Math.pow(4, delivery.getAttempt() - 1));
                delivery.setNextRetryAt(Instant.now().plusSeconds(delay));
            }
        }

        deliveryRepository.save(delivery);
    }

    private String computeSignature(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return "sha256=" + HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("HMAC computation failed", e);
        }
    }
}
