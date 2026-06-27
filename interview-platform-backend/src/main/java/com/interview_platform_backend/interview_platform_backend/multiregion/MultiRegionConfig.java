package com.interview_platform_backend.interview_platform_backend.multiregion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import java.util.List;

@Configuration
@ConditionalOnProperty(name = "app.multi-region.enabled", havingValue = "true")
public class MultiRegionConfig {
    private static final Logger log = LoggerFactory.getLogger(MultiRegionConfig.class);

    @Value("${app.multi-region.current-region:us-east-1}")
    private String currentRegion;

    @Value("${app.multi-region.primary-region:us-east-1}")
    private String primaryRegion;

    @Value("${app.multi-region.regions:us-east-1,eu-west-1,ap-southeast-1}")
    private List<String> availableRegions;

    @Value("${app.multi-region.geo-dns.enabled:false}")
    private boolean geoDnsEnabled;

    @Value("${app.multi-region.replication.mode:async}")
    private String replicationMode;

    @PostConstruct
    public void init() {
        log.info("Multi-region deployment: current={}, primary={}, regions={}", currentRegion, primaryRegion, availableRegions);
        log.info("  Geo-DNS: {}, Replication: {}", geoDnsEnabled, replicationMode);
    }

    public String getCurrentRegion() { return currentRegion; }
    public String getPrimaryRegion() { return primaryRegion; }
    public List<String> getAvailableRegions() { return availableRegions; }
    public boolean isPrimary() { return currentRegion.equals(primaryRegion); }
    public boolean isGeoDnsEnabled() { return geoDnsEnabled; }
    public String getReplicationMode() { return replicationMode; }
}
