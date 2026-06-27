package com.interview_platform_backend.interview_platform_backend.distributedcache.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Distributed Redis cache replacing Caffeine L1 cache.
 * Provides consistent caching across multiple application instances.
 * Caffeine is removed in favor of Redis-only caching for multi-instance deployments.
 */
@Configuration
@ConditionalOnProperty(name = "app.cache.distributed.enabled", havingValue = "true")
public class DistributedCacheConfig {

    private static final Logger log = LoggerFactory.getLogger(DistributedCacheConfig.class);

    @Value("${app.cache.default-ttl-minutes:60}")
    private long defaultTtlMinutes;

    @Value("${app.cache.user-ttl-minutes:30}")
    private long userTtlMinutes;

    @Value("${app.cache.interview-ttl-minutes:15}")
    private long interviewTtlMinutes;

    @Value("${app.cache.analytics-ttl-minutes:5}")
    private long analyticsTtlMinutes;

    @PostConstruct
    public void init() {
        log.info("Distributed Redis cache enabled (replacing Caffeine L1)");
        log.info("  Default TTL: {}min, User: {}min, Interview: {}min, Analytics: {}min",
                defaultTtlMinutes, userTtlMinutes, interviewTtlMinutes, analyticsTtlMinutes);
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(defaultTtlMinutes))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        cacheConfigs.put("users", defaultConfig.entryTtl(Duration.ofMinutes(userTtlMinutes)));
        cacheConfigs.put("interviews", defaultConfig.entryTtl(Duration.ofMinutes(interviewTtlMinutes)));
        cacheConfigs.put("analytics", defaultConfig.entryTtl(Duration.ofMinutes(analyticsTtlMinutes)));
        cacheConfigs.put("permissions", defaultConfig.entryTtl(Duration.ofMinutes(120)));
        cacheConfigs.put("feature-flags", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        cacheConfigs.put("job-positions", defaultConfig.entryTtl(Duration.ofMinutes(30)));
        cacheConfigs.put("templates", defaultConfig.entryTtl(Duration.ofMinutes(60)));

        log.info("Configured {} named caches with per-cache TTLs", cacheConfigs.size());

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .transactionAware()
                .build();
    }
}
