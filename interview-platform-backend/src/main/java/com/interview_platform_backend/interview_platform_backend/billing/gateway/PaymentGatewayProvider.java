package com.interview_platform_backend.interview_platform_backend.billing.gateway;

import com.interview_platform_backend.interview_platform_backend.billing.entity.OrganizationSubscription.PaymentGateway;
import java.math.BigDecimal;
import java.util.Map;

/**
 * Unified interface for all payment gateway integrations.
 * Implementations: Stripe, Razorpay, PayU, Cashfree, PhonePe.
 */
public interface PaymentGatewayProvider {

    PaymentGateway getGatewayType();

    /** Create a customer in the gateway */
    String createCustomer(String name, String email, String phone);

    /** Create a subscription */
    Map<String, Object> createSubscription(String customerId, String planId, String currency);

    /** Create a one-time payment order/session */
    Map<String, Object> createPaymentOrder(BigDecimal amount, String currency, String description, Map<String, String> metadata);

    /** Verify payment signature/callback (gateway-specific) */
    boolean verifyPayment(Map<String, String> paymentData);

    /** Cancel a subscription */
    void cancelSubscription(String subscriptionId);

    /** Get payment status */
    String getPaymentStatus(String paymentId);

    /** Generate invoice/receipt URL */
    String getInvoiceUrl(String paymentId);

    /** Process refund */
    Map<String, Object> refund(String paymentId, BigDecimal amount, String reason);
}
