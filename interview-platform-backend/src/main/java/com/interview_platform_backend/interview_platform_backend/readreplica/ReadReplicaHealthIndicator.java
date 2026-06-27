package com.interview_platform_backend.interview_platform_backend.readreplica;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.sql.DataSource;

/**
 * Health check for read replica connectivity.
 * Verifies the replica is reachable on startup and provides status via logging.
 */
@Component
@ConditionalOnProperty(name = "app.read-replica.enabled", havingValue = "true")
public class ReadReplicaHealthIndicator {

    private static final Logger log = LoggerFactory.getLogger(ReadReplicaHealthIndicator.class);

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.read-replica.url:}")
    private String replicaUrl;

    public ReadReplicaHealthIndicator(DataSource dataSource) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
    }

    @PostConstruct
    public void checkHealth() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            log.info("Read replica health check PASSED: {}", replicaUrl);
        } catch (Exception e) {
            log.warn("Read replica health check FAILED: {} - {}", replicaUrl, e.getMessage());
        }
    }

    public boolean isHealthy() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getReplicaUrl() {
        return replicaUrl;
    }
}
