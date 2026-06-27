package com.interview_platform_backend.interview_platform_backend.sharding.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import java.util.*;

@Configuration
@ConditionalOnProperty(name = "app.sharding.enabled", havingValue = "true")
public class ShardingConfig {
    private static final Logger log = LoggerFactory.getLogger(ShardingConfig.class);

    @Value("${app.sharding.strategy:hash}")
    private String strategy; // hash, range, directory

    @Value("${app.sharding.shard-count:4}")
    private int shardCount;

    @Value("${app.sharding.shard-key:organization_id}")
    private String shardKey;

    @PostConstruct
    public void init() { log.info("Database sharding enabled: strategy={}, shards={}, key={}", strategy, shardCount, shardKey); }

    public String getStrategy() { return strategy; }
    public int getShardCount() { return shardCount; }
    public String getShardKey() { return shardKey; }
}
