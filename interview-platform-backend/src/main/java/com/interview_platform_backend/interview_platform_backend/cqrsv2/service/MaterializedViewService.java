package com.interview_platform_backend.interview_platform_backend.cqrsv2.service;

import com.interview_platform_backend.interview_platform_backend.cqrsv2.config.CqrsV2Config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@ConditionalOnProperty(name = "app.cqrs.v2.enabled", havingValue = "true")
public class MaterializedViewService {
    private static final Logger log = LoggerFactory.getLogger(MaterializedViewService.class);
    private final CqrsV2Config config;
    private final Map<String, Map<String, Map<String, Object>>> views = new ConcurrentHashMap<>();

    public MaterializedViewService(CqrsV2Config config) { this.config = config; }

    public void updateView(String viewName, String key, Map<String, Object> data) {
        views.computeIfAbsent(viewName, k -> new ConcurrentHashMap<>()).put(key, data);
        log.debug("Updated materialized view: {}/{}", viewName, key);
    }

    public Map<String, Object> getView(String viewName, String key) {
        return views.getOrDefault(viewName, Map.of()).get(key);
    }

    public Map<String, Object> getViewStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("viewCount", views.size());
        stats.put("totalEntries", views.values().stream().mapToInt(Map::size).sum());
        stats.put("projectionTargets", config.getProjectionTargets());
        stats.put("lastUpdated", Instant.now().toString());
        return stats;
    }

    public void rebuildView(String viewName) {
        log.info("Rebuilding materialized view: {} (batch size: {})", viewName, config.getReplayBatchSize());
        views.put(viewName, new ConcurrentHashMap<>());
    }
}
