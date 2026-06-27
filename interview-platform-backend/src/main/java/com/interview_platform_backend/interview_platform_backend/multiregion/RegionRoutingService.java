package com.interview_platform_backend.interview_platform_backend.multiregion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@ConditionalOnProperty(name = "app.multi-region.enabled", havingValue = "true")
public class RegionRoutingService {
    private static final Logger log = LoggerFactory.getLogger(RegionRoutingService.class);

    private final MultiRegionConfig config;

    private static final Map<String, String> COUNTRY_TO_REGION = Map.ofEntries(
        Map.entry("US", "us-east-1"), Map.entry("CA", "us-east-1"),
        Map.entry("GB", "eu-west-1"), Map.entry("DE", "eu-west-1"), Map.entry("FR", "eu-west-1"),
        Map.entry("IN", "ap-southeast-1"), Map.entry("SG", "ap-southeast-1"), Map.entry("AU", "ap-southeast-1"), Map.entry("JP", "ap-southeast-1")
    );

    public RegionRoutingService(MultiRegionConfig config) {
        this.config = config;
    }

    public String resolveRegion(String countryCode) {
        return COUNTRY_TO_REGION.getOrDefault(countryCode.toUpperCase(), config.getPrimaryRegion());
    }

    public boolean isLocalRegion(String targetRegion) {
        return config.getCurrentRegion().equals(targetRegion);
    }

    public Map<String, Object> getRegionStatus() {
        return Map.of(
            "currentRegion", config.getCurrentRegion(),
            "isPrimary", config.isPrimary(),
            "availableRegions", config.getAvailableRegions(),
            "geoDnsEnabled", config.isGeoDnsEnabled(),
            "replicationMode", config.getReplicationMode()
        );
    }

    public String getRegionEndpoint(String region) {
        return switch (region) {
            case "us-east-1" -> "https://us.interview-platform.app";
            case "eu-west-1" -> "https://eu.interview-platform.app";
            case "ap-southeast-1" -> "https://ap.interview-platform.app";
            default -> "https://interview-platform.app";
        };
    }
}
