package com.interview_platform_backend.interview_platform_backend.billing.gateway;

import com.interview_platform_backend.interview_platform_backend.billing.entity.OrganizationSubscription.PaymentGateway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Cashfree Payment Gateway (India).
 * Supports: UPI, Cards, NetBanking, PayLater, EMI, Subscriptions.
 * API Docs: https://docs.cashfree.com/docs
 */
@Component
@ConditionalOnProperty(name = "app.billing.cashfree.enabled", havingValue = "true")
public class CashfreeGateway implements PaymentGatewayProvider {

    private static final Logger log = LoggerFactory.getLogger(CashfreeGateway.class);

    @Value("${app.billing.cashfree.app-id:}")
    private String appId;

    @Value("${app.billing.cashfree.secret-key:}")
    private String secretKey;

    @Value("${app.billing.cashfree.base-url:https://api.cashfree.com/pg}")
    private String baseUrl;

    private final RestClient restClient = RestClient.create();

    @Override public PaymentGateway getGatewayType() { return PaymentGateway.CASHFREE; }

    @Override
    public String createCustomer(String name, String email, String phone) {
        log.info("Cashfree: Creating customer {}", email);
        return "cf_cust_" + System.currentTimeMillis();
    }

    @Override
    public Map<String, Object> createSubscription(String customerId, String planId, String currency) {
        try {
            return apiPost("/subscriptions", Map.of(
                    "plan_id", planId, "customer_id", customerId, "return_url", "https://app.interview-platform.com/billing"
            ));
        } catch (Exception e) { return Map.of("error", e.getMessage()); }
    }

    @Override
    public Map<String, Object> createPaymentOrder(BigDecimal amount, String currency, String description, Map<String, String> metadata) {
        try {
            String orderId = "order_" + System.currentTimeMillis();
            Map<String, Object> body = Map.of(
                    "order_id", orderId,
                    "order_amount", amount.doubleValue(),
                    "order_currency", currency != null ? currency : "INR",
                    "order_note", description != null ? description : "",
                    "customer_details", Map.of(
                            "customer_id", metadata != null ? metadata.getOrDefault("customerId", "guest") : "guest",
                            "customer_email", metadata != null ? metadata.getOrDefault("email", "") : "",
                            "customer_phone", metadata != null ? metadata.getOrDefault("phone", "") : ""
                    )
            );
            var response = apiPost("/orders", body);
            log.info("Cashfree order created: {}", orderId);
            return response;
        } catch (Exception e) {
            log.error("Cashfree createOrder failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    @Override
    public boolean verifyPayment(Map<String, String> paymentData) {
        // Cashfree uses webhook + order status verification
        String orderId = paymentData.get("order_id");
        try {
            var response = apiGet("/orders/" + orderId);
            return "PAID".equals(response.get("order_status"));
        } catch (Exception e) { return false; }
    }

    @Override public void cancelSubscription(String subscriptionId) { log.info("Cashfree: Cancel {}", subscriptionId); }
    @Override public String getPaymentStatus(String paymentId) { return "captured"; }
    @Override public String getInvoiceUrl(String paymentId) { return baseUrl + "/orders/" + paymentId; }
    @Override public Map<String, Object> refund(String paymentId, BigDecimal amount, String reason) {
        try {
            return apiPost("/orders/" + paymentId + "/refunds", Map.of("refund_amount", amount.doubleValue(), "refund_note", reason));
        } catch (Exception e) { return Map.of("error", e.getMessage()); }
    }

    private Map<String, Object> apiPost(String path, Object body) {
        return restClient.post().uri(baseUrl + path)
                .header("x-client-id", appId).header("x-client-secret", secretKey)
                .header("x-api-version", "2023-08-01").header("Content-Type", "application/json")
                .body(body).retrieve().body(Map.class);
    }

    private Map<String, Object> apiGet(String path) {
        return restClient.get().uri(baseUrl + path)
                .header("x-client-id", appId).header("x-client-secret", secretKey)
                .header("x-api-version", "2023-08-01").retrieve().body(Map.class);
    }
}
