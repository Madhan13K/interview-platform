package com.interview_platform_backend.interview_platform_backend.multiregionactive.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import java.util.*;

@Configuration
@ConditionalOnProperty(name = "app.active-active.enabled", havingValue = "true")
public class ActiveActiveConfig {
    private static final Logger log = LoggerFactory.getLogger(ActiveActiveConfig.class);

    @Value("${app.active-active.current-region:us-east-1}")
    private String currentRegion;

    @Value("${app.active-active.regions:us-east-1,eu-west-1,ap-southeast-1}")
    private List<String> regions;

    @Value("${app.active-active.conflict-resolution:last-write-wins}")
    private String conflictResolution;

    @Value("${app.active-active.replication-lag-ms:500}")
    private long replicationLagMs;

    @PostConstruct
    public void init() {
        log.info("Active-Active multi-region enabled: current={}, regions={}, conflict={}", currentRegion, regions, conflictResolution);
    }

    public String getCurrentRegion() { return currentRegion; }
    public List<String> getRegions() { return regions; }
    public String getConflictResolution() { return conflictResolution; }
    public long getReplicationLagMs() { return replicationLagMs; }
}
