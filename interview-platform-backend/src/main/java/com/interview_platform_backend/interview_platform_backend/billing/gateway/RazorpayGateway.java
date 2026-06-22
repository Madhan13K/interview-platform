package com.interview_platform_backend.interview_platform_backend.billing.gateway;

import com.interview_platform_backend.interview_platform_backend.billing.entity.OrganizationSubscription.PaymentGateway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.util.Base64;
import java.util.Map;

/**
 * Razorpay Payment Gateway (India).
 * Supports: UPI, Cards, NetBanking, Wallets, EMI, Subscriptions.
 * API Docs: https://razorpay.com/docs/api
 */
@Component
@ConditionalOnProperty(name = "app.billing.razorpay.enabled", havingValue = "true")
public class RazorpayGateway implements PaymentGatewayProvider {

    private static final Logger log = LoggerFactory.getLogger(RazorpayGateway.class);
    private static final String BASE_URL = "https://api.razorpay.com/v1";

    @Value("${app.billing.razorpay.key-id:}")
    private String keyId;

    @Value("${app.billing.razorpay.key-secret:}")
    private String keySecret;

    private final RestClient restClient = RestClient.create();

    @Override
    public PaymentGateway getGatewayType() { return PaymentGateway.RAZORPAY; }

    @Override
    public String createCustomer(String name, String email, String phone) {
        try {
            var response = apiPost("/customers", Map.of("name", name, "email", email, "contact", phone != null ? phone : ""));
            return (String) response.get("id");
        } catch (Exception e) {
            log.error("Razorpay createCustomer failed: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public Map<String, Object> createSubscription(String customerId, String planId, String currency) {
        try {
            return apiPost("/subscriptions", Map.of(
                    "plan_id", planId,
                    "customer_id", customerId,
                    "total_count", 12,
                    "quantity", 1
            ));
        } catch (Exception e) {
            log.error("Razorpay createSubscription failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    @Override
    public Map<String, Object> createPaymentOrder(BigDecimal amount, String currency, String description, Map<String, String> metadata) {
        try {
            int amountInPaise = amount.multiply(BigDecimal.valueOf(100)).intValue();
            Map<String, Object> body = Map.of(
                    "amount", amountInPaise,
                    "currency", currency != null ? currency : "INR",
                    "receipt", "rcpt_" + System.currentTimeMillis(),
                    "notes", metadata != null ? metadata : Map.of()
            );
            var response = apiPost("/orders", body);
            log.info("Razorpay order created: {}", response.get("id"));
            return response;
        } catch (Exception e) {
            log.error("Razorpay createOrder failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    @Override
    public boolean verifyPayment(Map<String, String> paymentData) {
        try {
            String orderId = paymentData.get("razorpay_order_id");
            String paymentId = paymentData.get("razorpay_payment_id");
            String signature = paymentData.get("razorpay_signature");
            String payload = orderId + "|" + paymentId;
            String generatedSignature = hmacSha256(payload, keySecret);
            boolean valid = generatedSignature.equals(signature);
            log.info("Razorpay payment verification: {} (payment={})", valid ? "VALID" : "INVALID", paymentId);
            return valid;
        } catch (Exception e) {
            log.error("Razorpay verification failed: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public void cancelSubscription(String subscriptionId) {
        try {
            apiPost("/subscriptions/" + subscriptionId + "/cancel", Map.of("cancel_at_cycle_end", 1));
            log.info("Razorpay subscription cancelled: {}", subscriptionId);
        } catch (Exception e) {
            log.error("Razorpay cancel failed: {}", e.getMessage());
        }
    }

    @Override
    public String getPaymentStatus(String paymentId) {
        try {
            var response = apiGet("/payments/" + paymentId);
            return (String) response.get("status");
        } catch (Exception e) { return "unknown"; }
    }

    @Override
    public String getInvoiceUrl(String paymentId) {
        return "https://dashboard.razorpay.com/payments/" + paymentId;
    }

    @Override
    public Map<String, Object> refund(String paymentId, BigDecimal amount, String reason) {
        try {
            int amountInPaise = amount.multiply(BigDecimal.valueOf(100)).intValue();
            return apiPost("/payments/" + paymentId + "/refund", Map.of("amount", amountInPaise, "notes", Map.of("reason", reason)));
        } catch (Exception e) {
            return Map.of("error", e.getMessage());
        }
    }

    private Map<String, Object> apiPost(String path, Object body) {
        String auth = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes());
        return restClient.post().uri(BASE_URL + path)
                .header("Authorization", "Basic " + auth)
                .header("Content-Type", "application/json")
                .body(body).retrieve().body(Map.class);
    }

    private Map<String, Object> apiGet(String path) {
        String auth = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes());
        return restClient.get().uri(BASE_URL + path)
                .header("Authorization", "Basic " + auth)
                .retrieve().body(Map.class);
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));
        byte[] hash = mac.doFinal(data.getBytes());
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) hex.append(String.format("%02x", b));
        return hex.toString();
    }
}
