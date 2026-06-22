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
import java.util.Map;

/**
 * PayU Payment Gateway (India).
 * Supports: UPI, Cards, NetBanking, Wallets, EMI, BNPL.
 * API Docs: https://devguide.payu.in/
 */
@Component
@ConditionalOnProperty(name = "app.billing.payu.enabled", havingValue = "true")
public class PayUGateway implements PaymentGatewayProvider {

    private static final Logger log = LoggerFactory.getLogger(PayUGateway.class);

    @Value("${app.billing.payu.merchant-key:}")
    private String merchantKey;

    @Value("${app.billing.payu.merchant-salt:}")
    private String merchantSalt;

    @Value("${app.billing.payu.base-url:https://info.payu.in}")
    private String baseUrl;

    private final RestClient restClient = RestClient.create();

    @Override public PaymentGateway getGatewayType() { return PaymentGateway.PAYU; }

    @Override public String createCustomer(String name, String email, String phone) {
        return email; // PayU uses email as customer identifier
    }

    @Override public Map<String, Object> createSubscription(String customerId, String planId, String currency) {
        return Map.of("error", "Use PayU subscription API separately");
    }

    @Override
    public Map<String, Object> createPaymentOrder(BigDecimal amount, String currency, String description, Map<String, String> metadata) {
        try {
            String txnId = "TXN" + System.currentTimeMillis();
            String email = metadata != null ? metadata.getOrDefault("email", "customer@email.com") : "customer@email.com";
            String firstName = metadata != null ? metadata.getOrDefault("firstName", "Customer") : "Customer";
            String hashString = merchantKey + "|" + txnId + "|" + amount.toPlainString() + "|" + description + "|" + firstName + "|" + email + "|||||||||||" + merchantSalt;
            String hash = sha512(hashString);

            Map<String, Object> paymentData = Map.of(
                    "key", merchantKey,
                    "txnid", txnId,
                    "amount", amount.toPlainString(),
                    "productinfo", description != null ? description : "Subscription",
                    "firstname", firstName,
                    "email", email,
                    "hash", hash,
                    "surl", metadata != null ? metadata.getOrDefault("successUrl", "") : "",
                    "furl", metadata != null ? metadata.getOrDefault("failureUrl", "") : ""
            );

            log.info("PayU payment order created: txn={}", txnId);
            return paymentData;
        } catch (Exception e) {
            log.error("PayU createOrder failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    @Override
    public boolean verifyPayment(Map<String, String> paymentData) {
        try {
            String status = paymentData.get("status");
            String txnId = paymentData.get("txnid");
            String amount = paymentData.get("amount");
            String productInfo = paymentData.get("productinfo");
            String firstName = paymentData.get("firstname");
            String email = paymentData.get("email");
            String receivedHash = paymentData.get("hash");

            // Reverse hash: salt|status||||||||||email|firstname|productinfo|amount|txnid|key
            String reverseHashString = merchantSalt + "|" + status + "|||||||||||" + email + "|" + firstName + "|" + productInfo + "|" + amount + "|" + txnId + "|" + merchantKey;
            String computedHash = sha512(reverseHashString);
            return computedHash.equals(receivedHash);
        } catch (Exception e) {
            log.error("PayU verification failed: {}", e.getMessage());
            return false;
        }
    }

    @Override public void cancelSubscription(String subscriptionId) {}
    @Override public String getPaymentStatus(String paymentId) { return "captured"; }
    @Override public String getInvoiceUrl(String paymentId) { return null; }
    @Override public Map<String, Object> refund(String paymentId, BigDecimal amount, String reason) {
        return Map.of("info", "Refund via PayU dashboard or API");
    }

    private String sha512(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-512");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) hex.append(String.format("%02x", b));
        return hex.toString();
    }
}
