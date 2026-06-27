package com.interview_platform_backend.interview_platform_backend.gateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * API Gateway Configuration for Kong/Envoy integration.
 * When enabled, the application registers itself with the gateway
 * and configures rate limiting, auth caching, and canary deployments.
 */
@Configuration
@ConditionalOnProperty(name = "app.gateway.enabled", havingValue = "true")
public class GatewayConfig {

    private static final Logger log = LoggerFactory.getLogger(GatewayConfig.class);

    @Value("${app.gateway.type:kong}")
    private String gatewayType;

    @Value("${app.gateway.admin-url:http://localhost:8001}")
    private String adminUrl;

    @Value("${app.gateway.service-name:interview-platform}")
    private String serviceName;

    @Value("${app.gateway.upstream-url:http://localhost:8080}")
    private String upstreamUrl;

    @Value("${app.gateway.rate-limit.requests-per-second:100}")
    private int rateLimitRps;

    @Value("${app.gateway.rate-limit.burst:200}")
    private int rateLimitBurst;

    @Value("${app.gateway.auth-cache.ttl-seconds:300}")
    private int authCacheTtl;

    @Value("${app.gateway.canary.enabled:false}")
    private boolean canaryEnabled;

    @Value("${app.gateway.canary.weight:5}")
    private int canaryWeight;

    @PostConstruct
    public void init() {
        log.info("API Gateway integration enabled: type={}, admin={}", gatewayType, adminUrl);
        log.info("  Service: {} -> {}", serviceName, upstreamUrl);
        log.info("  Rate limit: {} rps (burst: {})", rateLimitRps, rateLimitBurst);
        log.info("  Auth cache TTL: {}s", authCacheTtl);
        log.info("  Canary: {} (weight: {}%)", canaryEnabled, canaryWeight);
    }

    public String getGatewayType() { return gatewayType; }
    public String getAdminUrl() { return adminUrl; }
    public String getServiceName() { return serviceName; }
    public String getUpstreamUrl() { return upstreamUrl; }
    public int getRateLimitRps() { return rateLimitRps; }
    public int getRateLimitBurst() { return rateLimitBurst; }
    public int getAuthCacheTtl() { return authCacheTtl; }
    public boolean isCanaryEnabled() { return canaryEnabled; }
    public int getCanaryWeight() { return canaryWeight; }
}
