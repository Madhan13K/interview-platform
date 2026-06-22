package com.interview_platform_backend.interview_platform_backend.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "invoices")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "invoice_number", unique = true, nullable = false)
    private String invoiceNumber; // INV-2026-0001

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "subscription_id")
    private UUID subscriptionId;

    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    private BigDecimal taxAmount; // GST for India

    @Column(name = "total_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "currency", nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status;

    @Column(name = "billing_period_start")
    private Instant billingPeriodStart;

    @Column(name = "billing_period_end")
    private Instant billingPeriodEnd;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "pdf_url")
    private String pdfUrl;

    @Column(name = "gstin")
    private String gstin; // India GST Number

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }

    public enum InvoiceStatus { DRAFT, OPEN, PAID, VOID, UNCOLLECTIBLE }
}
