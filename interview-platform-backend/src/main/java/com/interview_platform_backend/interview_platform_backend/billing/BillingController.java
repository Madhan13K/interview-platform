package com.interview_platform_backend.interview_platform_backend.billing;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/billing")
@ConditionalOnProperty(name = "app.billing.enabled", havingValue = "true")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/customers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createCustomer(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(billingService.createCustomer(
                request.get("organizationName"),
                request.get("email")
        ));
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createCheckout(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(billingService.createCheckoutSession(
                request.get("customerId"),
                request.get("priceId"),
                request.get("successUrl"),
                request.get("cancelUrl")
        ));
    }

    @GetMapping("/subscriptions/{subscriptionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSubscription(@PathVariable String subscriptionId) {
        return ResponseEntity.ok(billingService.getSubscription(subscriptionId));
    }

    @PostMapping("/subscriptions/{subscriptionId}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> cancelSubscription(@PathVariable String subscriptionId) {
        return ResponseEntity.ok(billingService.cancelSubscription(subscriptionId));
    }

    @PostMapping("/portal")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createPortalSession(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(billingService.createPortalSession(
                request.get("customerId"),
                request.get("returnUrl")
        ));
    }

    @PostMapping("/webhooks/stripe")
    public ResponseEntity<Void> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {
        billingService.handleWebhookEvent(payload, signature);
        return ResponseEntity.ok().build();
    }
}
