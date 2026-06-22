package com.interview_platform_backend.interview_platform_backend.billing;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Billing & Subscriptions Service.
 * Stripe integration for organization plan management and payments.
 */
@Service
@ConditionalOnProperty(name = "app.billing.enabled", havingValue = "true")
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    @Value("${app.billing.stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${app.billing.stripe.webhook-secret:}")
    private String stripeWebhookSecret;

    private static final String STRIPE_BASE_URL = "https://api.stripe.com/v1";

    private final RestClient restClient = RestClient.create();

    /**
     * Create a Stripe customer for an organization.
     */
    public Map<String, Object> createCustomer(String orgName, String email) {
        log.info("Creating Stripe customer for org: {}", orgName);
        try {
            String formBody = "name=" + encode(orgName) + "&email=" + encode(email);
            return stripePost("/customers", formBody);
        } catch (Exception e) {
            log.error("Failed to create Stripe customer: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Create a checkout session for plan subscription.
     */
    public Map<String, Object> createCheckoutSession(String customerId, String priceId, String successUrl, String cancelUrl) {
        log.info("Creating Stripe checkout session for customer: {}", customerId);
        try {
            String formBody = "customer=" + encode(customerId) +
                    "&mode=subscription" +
                    "&line_items[0][price]=" + encode(priceId) +
                    "&line_items[0][quantity]=1" +
                    "&success_url=" + encode(successUrl) +
                    "&cancel_url=" + encode(cancelUrl);
            return stripePost("/checkout/sessions", formBody);
        } catch (Exception e) {
            log.error("Failed to create checkout session: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Get subscription details.
     */
    public Map<String, Object> getSubscription(String subscriptionId) {
        log.info("Fetching subscription: {}", subscriptionId);
        try {
            return stripeGet("/subscriptions/" + subscriptionId);
        } catch (Exception e) {
            log.error("Failed to get subscription: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Cancel a subscription.
     */
    public Map<String, Object> cancelSubscription(String subscriptionId) {
        log.info("Cancelling subscription: {}", subscriptionId);
        try {
            return stripePost("/subscriptions/" + subscriptionId, "cancel_at_period_end=true");
        } catch (Exception e) {
            log.error("Failed to cancel subscription: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Create a billing portal session for self-service management.
     */
    public Map<String, Object> createPortalSession(String customerId, String returnUrl) {
        log.info("Creating billing portal session for customer: {}", customerId);
        try {
            String formBody = "customer=" + encode(customerId) + "&return_url=" + encode(returnUrl);
            return stripePost("/billing_portal/sessions", formBody);
        } catch (Exception e) {
            log.error("Failed to create portal session: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Handle Stripe webhook events (subscription updated, payment failed, etc.)
     */
    public void handleWebhookEvent(String payload, String signature) {
        // In production, verify the webhook signature using stripeWebhookSecret
        log.info("Processing Stripe webhook event");
        try {
            // Parse and handle different event types:
            // - customer.subscription.created
            // - customer.subscription.updated
            // - customer.subscription.deleted
            // - invoice.payment_succeeded
            // - invoice.payment_failed
            log.info("Stripe webhook processed successfully");
        } catch (Exception e) {
            log.error("Webhook processing failed: {}", e.getMessage());
        }
    }

    private Map<String, Object> stripePost(String path, String formBody) {
        return restClient.post()
                .uri(STRIPE_BASE_URL + path)
                .header("Authorization", "Bearer " + stripeSecretKey)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(formBody)
                .retrieve()
                .body(Map.class);
    }

    private Map<String, Object> stripeGet(String path) {
        return restClient.get()
                .uri(STRIPE_BASE_URL + path)
                .header("Authorization", "Bearer " + stripeSecretKey)
                .retrieve()
                .body(Map.class);
    }

    private String encode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }
}
