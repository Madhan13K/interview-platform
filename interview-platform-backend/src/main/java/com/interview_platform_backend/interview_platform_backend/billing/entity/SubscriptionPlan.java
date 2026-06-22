package com.interview_platform_backend.interview_platform_backend.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SubscriptionPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String slug; // "starter", "professional", "enterprise"

    @Column(nullable = false)
    private String name; // Display name

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "price_monthly_usd", precision = 10, scale = 2)
    private BigDecimal priceMonthlyUsd;

    @Column(name = "price_monthly_inr", precision = 10, scale = 2)
    private BigDecimal priceMonthlyInr;

    @Column(name = "price_yearly_usd", precision = 10, scale = 2)
    private BigDecimal priceYearlyUsd;

    @Column(name = "price_yearly_inr", precision = 10, scale = 2)
    private BigDecimal priceYearlyInr;

    // Limits
    @Column(name = "max_users")
    private Integer maxUsers;

    @Column(name = "max_interviews_per_month")
    private Integer maxInterviewsPerMonth;

    @Column(name = "max_job_positions")
    private Integer maxJobPositions;

    @Column(name = "max_storage_gb")
    private Integer maxStorageGb;

    // Feature flags
    @Column(name = "ai_features_enabled")
    private Boolean aiFeaturesEnabled;

    @Column(name = "video_interviews_enabled")
    private Boolean videoInterviewsEnabled;

    @Column(name = "sso_enabled")
    private Boolean ssoEnabled;

    @Column(name = "api_access_enabled")
    private Boolean apiAccessEnabled;

    @Column(name = "custom_branding_enabled")
    private Boolean customBrandingEnabled;

    @Column(name = "priority_support")
    private Boolean prioritySupport;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); if (isActive == null) isActive = true; }
}
