package com.interview_platform_backend.interview_platform_backend.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payment_transactions")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "subscription_id")
    private UUID subscriptionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "gateway", nullable = false)
    private OrganizationSubscription.PaymentGateway gateway;

    @Column(name = "gateway_payment_id")
    private String gatewayPaymentId; // pay_xxx (Razorpay) / pi_xxx (Stripe)

    @Column(name = "gateway_order_id")
    private String gatewayOrderId;

    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type")
    private TransactionType type;

    @Column(name = "payment_method")
    private String paymentMethod; // "card", "upi", "netbanking", "wallet"

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "invoice_url")
    private String invoiceUrl;

    @Column(name = "receipt_url")
    private String receiptUrl;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public enum TransactionStatus { PENDING, AUTHORIZED, CAPTURED, FAILED, REFUNDED }
    public enum TransactionType { SUBSCRIPTION, ONE_TIME, REFUND, UPGRADE, DOWNGRADE }
}
