package com.interview_platform_backend.interview_platform_backend.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "marketplace_plugins")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class MarketplacePlugin {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "slug", nullable = false, unique = true)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "short_description")
    private String shortDescription;

    @Column(name = "vendor_name", nullable = false)
    private String vendorName;

    @Column(name = "vendor_email")
    private String vendorEmail;

    @Column(name = "vendor_url")
    private String vendorUrl;

    @Column(name = "version", nullable = false)
    private String version;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private Category category;

    @Column(name = "icon_url")
    private String iconUrl;

    @Column(name = "screenshot_urls", columnDefinition = "TEXT")
    private String screenshotUrls;

    @Column(name = "documentation_url")
    private String documentationUrl;

    @Column(name = "webhook_url")
    private String webhookUrl;

    @Column(name = "config_schema", columnDefinition = "TEXT")
    private String configSchema;

    @Enumerated(EnumType.STRING)
    @Column(name = "pricing", nullable = false)
    @Builder.Default
    private Pricing pricing = Pricing.FREE;

    @Column(name = "monthly_price", precision = 10, scale = 2)
    private BigDecimal monthlyPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column(name = "install_count")
    @Builder.Default
    private int installCount = 0;

    @Column(name = "rating")
    @Builder.Default
    private double rating = 0.0;

    @Column(name = "review_count")
    @Builder.Default
    private int reviewCount = 0;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public enum Category {
        ASSESSMENT, ANALYTICS, INTEGRATION, COMMUNICATION, AI, SECURITY
    }

    public enum Pricing {
        FREE, FREEMIUM, PAID
    }

    public enum Status {
        DRAFT, PENDING_REVIEW, PUBLISHED, SUSPENDED, DEPRECATED
    }
}
