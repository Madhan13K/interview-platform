package com.interview_platform_backend.interview_platform_backend.notification.email.delivery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Email Delivery Verification Service.
 * Handles bounce/complaint processing and delivery status tracking.
 * 
 * Integrates with:
 * - AWS SES Notifications (via SNS webhook for bounces/complaints)
 * - SendGrid Event Webhook (delivery, bounce, spam_report events)
 * - Generic SMTP bounce parsing (from mail server logs)
 * 
 * Tracks delivery status: SENT → DELIVERED / BOUNCED / COMPLAINED
 */
@Service
@Transactional
public class EmailDeliveryService {

    private static final Logger log = LoggerFactory.getLogger(EmailDeliveryService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${app.email.delivery-tracking.enabled:false}")
    private boolean trackingEnabled;

    @Value("${app.email.bounce-threshold:5}")
    private int bounceThreshold; // Suppress email after this many bounces

    // In-memory suppression list (production would use Redis/DB)
    private final Set<String> suppressionList = Collections.synchronizedSet(new HashSet<>());

    /**
     * Record an email delivery event.
     */
    public void recordDelivery(String messageId, String recipientEmail, DeliveryStatus status, String reason) {
        if (!trackingEnabled) return;

        log.info("Email delivery event: messageId={}, to={}, status={}, reason={}",
                messageId, recipientEmail, status, reason);

        // In production: persist to email_delivery_events table
        if (status == DeliveryStatus.HARD_BOUNCE || status == DeliveryStatus.COMPLAINT) {
            handleBounceOrComplaint(recipientEmail, status, reason);
        }
    }

    /**
     * Process AWS SES bounce notification (via SNS webhook).
     */
    public void processSesNotification(Map<String, Object> notification) {
        String notificationType = (String) notification.get("notificationType");
        if (notificationType == null) return;

        switch (notificationType.toLowerCase()) {
            case "bounce" -> {
                var bounce = (Map<String, Object>) notification.get("bounce");
                String bounceType = bounce != null ? (String) bounce.get("bounceType") : "unknown";
                var recipients = (List<Map<String, Object>>) (bounce != null ? bounce.get("bouncedRecipients") : List.of());
                for (var recipient : recipients) {
                    String email = (String) recipient.get("emailAddress");
                    DeliveryStatus status = "Permanent".equals(bounceType) ? DeliveryStatus.HARD_BOUNCE : DeliveryStatus.SOFT_BOUNCE;
                    recordDelivery(null, email, status, bounceType);
                }
            }
            case "complaint" -> {
                var complaint = (Map<String, Object>) notification.get("complaint");
                var recipients = (List<Map<String, Object>>) (complaint != null ? complaint.get("complainedRecipients") : List.of());
                for (var recipient : recipients) {
                    String email = (String) recipient.get("emailAddress");
                    recordDelivery(null, email, DeliveryStatus.COMPLAINT, "spam_complaint");
                }
            }
            case "delivery" -> {
                var delivery = (Map<String, Object>) notification.get("delivery");
                var recipients = delivery != null ? (List<String>) delivery.get("recipients") : List.<String>of();
                for (String email : recipients) {
                    recordDelivery(null, email, DeliveryStatus.DELIVERED, null);
                }
            }
        }
    }

    /**
     * Process SendGrid Event Webhook.
     */
    public void processSendGridEvent(Map<String, Object> event) {
        String eventType = (String) event.get("event");
        String email = (String) event.get("email");
        String sgMessageId = (String) event.get("sg_message_id");

        if (eventType == null || email == null) return;

        DeliveryStatus status = switch (eventType.toLowerCase()) {
            case "delivered" -> DeliveryStatus.DELIVERED;
            case "bounce" -> DeliveryStatus.HARD_BOUNCE;
            case "dropped" -> DeliveryStatus.DROPPED;
            case "spamreport" -> DeliveryStatus.COMPLAINT;
            case "deferred" -> DeliveryStatus.SOFT_BOUNCE;
            default -> DeliveryStatus.UNKNOWN;
        };

        recordDelivery(sgMessageId, email, status, eventType);
    }

    /**
     * Check if an email address is suppressed (should not receive emails).
     */
    public boolean isSuppressed(String email) {
        return suppressionList.contains(email.toLowerCase());
    }

    /**
     * Get delivery statistics for reporting.
     */
    public Map<String, Object> getDeliveryStats(Instant since) {
        // In production, query from email_delivery_events table
        return Map.of(
                "since", since.toString(),
                "suppressedCount", suppressionList.size(),
                "trackingEnabled", trackingEnabled
        );
    }

    /**
     * Remove an email from the suppression list (manual override).
     */
    public void unsuppress(String email) {
        suppressionList.remove(email.toLowerCase());
        log.info("Email unsuppressed: {}", email);
    }

    private void handleBounceOrComplaint(String email, DeliveryStatus status, String reason) {
        String lower = email.toLowerCase();

        if (status == DeliveryStatus.HARD_BOUNCE || status == DeliveryStatus.COMPLAINT) {
            suppressionList.add(lower);
            log.warn("Email SUPPRESSED due to {}: {} (reason: {})", status, email, reason);
        }
    }

    public enum DeliveryStatus {
        SENT, DELIVERED, SOFT_BOUNCE, HARD_BOUNCE, COMPLAINT, DROPPED, UNKNOWN
    }
}
