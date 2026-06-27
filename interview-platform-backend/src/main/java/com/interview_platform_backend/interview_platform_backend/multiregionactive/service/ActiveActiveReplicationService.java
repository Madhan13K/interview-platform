package com.interview_platform_backend.interview_platform_backend.multiregionactive.service;

import com.interview_platform_backend.interview_platform_backend.multiregionactive.config.ActiveActiveConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
@ConditionalOnProperty(name = "app.active-active.enabled", havingValue = "true")
public class ActiveActiveReplicationService {
    private static final Logger log = LoggerFactory.getLogger(ActiveActiveReplicationService.class);
    private final ActiveActiveConfig config;
    private final Queue<Map<String, Object>> replicationQueue = new ConcurrentLinkedQueue<>();

    public ActiveActiveReplicationService(ActiveActiveConfig config) { this.config = config; }

    public void replicate(String entityType, UUID entityId, String operation, Map<String, Object> data) {
        Map<String, Object> event = Map.of("entityType", entityType, "entityId", entityId.toString(), "operation", operation, "data", data, "sourceRegion", config.getCurrentRegion(), "timestamp", Instant.now().toString());
        replicationQueue.add(event);
        log.debug("Queued replication: {} {} from {}", operation, entityType, config.getCurrentRegion());
    }

    public Map<String, Object> getStatus() {
        return Map.of("currentRegion", config.getCurrentRegion(), "activeRegions", config.getRegions(), "pendingReplications", replicationQueue.size(), "conflictResolution", config.getConflictResolution(), "replicationLagMs", config.getReplicationLagMs());
    }

    public List<Map<String, Object>> getPendingReplications() { return new ArrayList<>(replicationQueue); }
}
