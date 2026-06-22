package com.interview_platform_backend.interview_platform_backend.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organization_subscriptions")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class OrganizationSubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle")
    private BillingCycle billingCycle;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_gateway")
    private PaymentGateway paymentGateway;

    @Column(name = "gateway_subscription_id")
    private String gatewaySubscriptionId; // Stripe sub_xxx / Razorpay sub_xxx

    @Column(name = "gateway_customer_id")
    private String gatewayCustomerId;

    @Column(name = "amount", precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency")
    private String currency; // "USD", "INR"

    @Column(name = "current_period_start")
    private Instant currentPeriodStart;

    @Column(name = "current_period_end")
    private Instant currentPeriodEnd;

    @Column(name = "trial_ends_at")
    private Instant trialEndsAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); updatedAt = Instant.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }

    public enum SubscriptionStatus { TRIALING, ACTIVE, PAST_DUE, CANCELLED, EXPIRED, PAUSED }
    public enum BillingCycle { MONTHLY, YEARLY }
    public enum PaymentGateway { STRIPE, RAZORPAY, PAYU, CASHFREE, PHONEPE }
}
