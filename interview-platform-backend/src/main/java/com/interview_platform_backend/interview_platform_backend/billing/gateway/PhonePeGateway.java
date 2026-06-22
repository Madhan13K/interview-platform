package com.interview_platform_backend.interview_platform_backend.billing.gateway;

import com.interview_platform_backend.interview_platform_backend.billing.entity.OrganizationSubscription.PaymentGateway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;

/**
 * PhonePe Payment Gateway (India).
 * Supports: UPI, Cards, NetBanking, Wallets.
 * API Docs: https://developer.phonepe.com/docs
 */
@Component
@ConditionalOnProperty(name = "app.billing.phonepe.enabled", havingValue = "true")
public class PhonePeGateway implements PaymentGatewayProvider {

    private static final Logger log = LoggerFactory.getLogger(PhonePeGateway.class);

    @Value("${app.billing.phonepe.merchant-id:}")
    private String merchantId;

    @Value("${app.billing.phonepe.salt-key:}")
    private String saltKey;

    @Value("${app.billing.phonepe.salt-index:1}")
    private int saltIndex;

    @Value("${app.billing.phonepe.base-url:https://api.phonepe.com/apis/hermes}")
    private String baseUrl;

    private final RestClient restClient = RestClient.create();

    @Override public PaymentGateway getGatewayType() { return PaymentGateway.PHONEPE; }

    @Override public String createCustomer(String name, String email, String phone) {
        return "phonepe_cust_" + System.currentTimeMillis();
    }

    @Override public Map<String, Object> createSubscription(String customerId, String planId, String currency) {
        return Map.of("error", "PhonePe does not support recurring subscriptions directly. Use UPI autopay mandate.");
    }

    @Override
    public Map<String, Object> createPaymentOrder(BigDecimal amount, String currency, String description, Map<String, String> metadata) {
        try {
            long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();
            String txnId = "TXN_" + System.currentTimeMillis();
            Map<String, Object> payload = Map.of(
                    "merchantId", merchantId,
                    "merchantTransactionId", txnId,
                    "amount", amountInPaise,
                    "redirectUrl", metadata != null ? metadata.getOrDefault("redirectUrl", "") : "",
                    "redirectMode", "POST",
                    "callbackUrl", metadata != null ? metadata.getOrDefault("callbackUrl", "") : "",
                    "paymentInstrument", Map.of("type", "PAY_PAGE")
            );

            String payloadBase64 = Base64.getEncoder().encodeToString(
                    new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsBytes(payload));
            String checksum = sha256(payloadBase64 + "/pg/v1/pay" + saltKey) + "###" + saltIndex;

            var response = restClient.post().uri(baseUrl + "/pg/v1/pay")
                    .header("Content-Type", "application/json")
                    .header("X-VERIFY", checksum)
                    .body(Map.of("request", payloadBase64))
                    .retrieve().body(Map.class);

            log.info("PhonePe payment initiated: txn={}", txnId);
            return response != null ? response : Map.of("transactionId", txnId);
        } catch (Exception e) {
            log.error("PhonePe createOrder failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    @Override
    public boolean verifyPayment(Map<String, String> paymentData) {
        String txnId = paymentData.get("transactionId");
        try {
            String endpoint = "/pg/v1/status/" + merchantId + "/" + txnId;
            String checksum = sha256(endpoint + saltKey) + "###" + saltIndex;
            var response = restClient.get().uri(baseUrl + endpoint)
                    .header("X-VERIFY", checksum).header("X-MERCHANT-ID", merchantId)
                    .retrieve().body(Map.class);
            return response != null && "SUCCESS".equals(response.get("code"));
        } catch (Exception e) { return false; }
    }

    @Override public void cancelSubscription(String subscriptionId) {}
    @Override public String getPaymentStatus(String paymentId) { return "SUCCESS"; }
    @Override public String getInvoiceUrl(String paymentId) { return null; }
    @Override public Map<String, Object> refund(String paymentId, BigDecimal amount, String reason) {
        return Map.of("error", "Refund via PhonePe dashboard");
    }

    private String sha256(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) hex.append(String.format("%02x", b));
        return hex.toString();
    }
}
