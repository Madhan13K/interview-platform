package com.interview_platform_backend.interview_platform_backend.pooltuning.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import java.util.*;

/**
 * Dynamic connection pool tuning for multi-tenant workloads.
 * Monitors HikariCP metrics and adjusts pool size based on load.
 */
@Configuration
@ConditionalOnProperty(name = "app.pool-tuning.enabled", havingValue = "true")
public class ConnectionPoolTuningConfig {

    private static final Logger log = LoggerFactory.getLogger(ConnectionPoolTuningConfig.class);

    @Value("${app.pool-tuning.min-idle:5}")
    private int minIdle;

    @Value("${app.pool-tuning.max-pool-size:30}")
    private int maxPoolSize;

    @Value("${app.pool-tuning.connection-timeout-ms:30000}")
    private long connectionTimeout;

    @Value("${app.pool-tuning.idle-timeout-ms:600000}")
    private long idleTimeout;

    @Value("${app.pool-tuning.max-lifetime-ms:1800000}")
    private long maxLifetime;

    @Value("${app.pool-tuning.leak-detection-threshold-ms:60000}")
    private long leakDetectionThreshold;

    @PostConstruct
    public void init() {
        log.info("Connection pool tuning enabled:");
        log.info("  Min idle: {}, Max pool: {}, Connection timeout: {}ms", minIdle, maxPoolSize, connectionTimeout);
        log.info("  Idle timeout: {}ms, Max lifetime: {}ms, Leak detection: {}ms", idleTimeout, maxLifetime, leakDetectionThreshold);
    }

    public Map<String, Object> getPoolMetrics(DataSource dataSource) {
        if (dataSource instanceof HikariDataSource hikari) {
            HikariPoolMXBean pool = hikari.getHikariPoolMXBean();
            if (pool != null) {
                return Map.of(
                        "activeConnections", pool.getActiveConnections(),
                        "idleConnections", pool.getIdleConnections(),
                        "totalConnections", pool.getTotalConnections(),
                        "threadsAwaitingConnection", pool.getThreadsAwaitingConnection(),
                        "maxPoolSize", hikari.getMaximumPoolSize(),
                        "minIdle", hikari.getMinimumIdle(),
                        "connectionTimeout", hikari.getConnectionTimeout()
                );
            }
        }
        return Map.of("status", "not_hikari_datasource");
    }

    public void adjustPoolSize(DataSource dataSource, int newMaxSize) {
        if (dataSource instanceof HikariDataSource hikari) {
            int oldMax = hikari.getMaximumPoolSize();
            hikari.setMaximumPoolSize(Math.min(newMaxSize, 100)); // Cap at 100
            log.info("Pool size adjusted: {} -> {}", oldMax, hikari.getMaximumPoolSize());
        }
    }
}
