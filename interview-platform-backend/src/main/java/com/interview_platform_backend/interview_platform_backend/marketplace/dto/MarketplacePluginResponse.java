package com.interview_platform_backend.interview_platform_backend.marketplace.dto;

import com.interview_platform_backend.interview_platform_backend.marketplace.entity.MarketplacePlugin;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplacePluginResponse {

    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String shortDescription;
    private String vendorName;
    private String vendorEmail;
    private String vendorUrl;
    private String version;
    private MarketplacePlugin.Category category;
    private String iconUrl;
    private String screenshotUrls;
    private String documentationUrl;
    private String webhookUrl;
    private String configSchema;
    private MarketplacePlugin.Pricing pricing;
    private BigDecimal monthlyPrice;
    private MarketplacePlugin.Status status;
    private int installCount;
    private double rating;
    private int reviewCount;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant publishedAt;
}
