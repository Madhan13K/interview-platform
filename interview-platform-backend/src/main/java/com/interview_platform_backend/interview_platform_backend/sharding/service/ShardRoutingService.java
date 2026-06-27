package com.interview_platform_backend.interview_platform_backend.sharding.service;

import com.interview_platform_backend.interview_platform_backend.sharding.config.ShardingConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@ConditionalOnProperty(name = "app.sharding.enabled", havingValue = "true")
public class ShardRoutingService {
    private static final Logger log = LoggerFactory.getLogger(ShardRoutingService.class);
    private final ShardingConfig config;

    public ShardRoutingService(ShardingConfig config) { this.config = config; }

    public int resolveShard(UUID organizationId) {
        int shard = Math.abs(organizationId.hashCode() % config.getShardCount());
        log.trace("Resolved shard {} for org {}", shard, organizationId);
        return shard;
    }

    public Map<String, Object> getShardInfo() {
        return Map.of("strategy", config.getStrategy(), "shardCount", config.getShardCount(), "shardKey", config.getShardKey());
    }
}
