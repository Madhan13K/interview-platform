package com.interview_platform_backend.interview_platform_backend.gateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Registers the service with Kong/Envoy API Gateway.
 * Configures routes, plugins (rate-limiting, auth-cache, cors), and upstreams.
 */
@Service
@ConditionalOnProperty(name = "app.gateway.enabled", havingValue = "true")
public class GatewayRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(GatewayRegistrationService.class);

    private final GatewayConfig config;
    private final RestClient restClient = RestClient.create();

    public GatewayRegistrationService(GatewayConfig config) {
        this.config = config;
    }

    /**
     * Register service with Kong Gateway.
     */
    public void registerWithKong() {
        log.info("Registering service '{}' with Kong at {}", config.getServiceName(), config.getAdminUrl());

        try {
            // Create/update service
            restClient.put()
                    .uri(config.getAdminUrl() + "/services/" + config.getServiceName())
                    .body(Map.of(
                            "name", config.getServiceName(),
                            "url", config.getUpstreamUrl(),
                            "retries", 3,
                            "connect_timeout", 5000,
                            "write_timeout", 60000,
                            "read_timeout", 60000
                    ))
                    .retrieve().body(Map.class);

            // Create route
            restClient.post()
                    .uri(config.getAdminUrl() + "/services/" + config.getServiceName() + "/routes")
                    .body(Map.of(
                            "name", config.getServiceName() + "-route",
                            "paths", List.of("/api/v1"),
                            "strip_path", false,
                            "protocols", List.of("http", "https")
                    ))
                    .retrieve().body(Map.class);

            // Enable rate-limiting plugin
            restClient.post()
                    .uri(config.getAdminUrl() + "/services/" + config.getServiceName() + "/plugins")
                    .body(Map.of(
                            "name", "rate-limiting",
                            "config", Map.of(
                                    "second", config.getRateLimitRps(),
                                    "policy", "redis",
                                    "fault_tolerant", true,
                                    "hide_client_headers", false
                            )
                    ))
                    .retrieve().body(Map.class);

            // Enable CORS plugin
            restClient.post()
                    .uri(config.getAdminUrl() + "/services/" + config.getServiceName() + "/plugins")
                    .body(Map.of(
                            "name", "cors",
                            "config", Map.of(
                                    "origins", List.of("*"),
                                    "methods", List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"),
                                    "headers", List.of("Authorization", "Content-Type", "X-Request-ID"),
                                    "credentials", true,
                                    "max_age", 3600
                            )
                    ))
                    .retrieve().body(Map.class);

            log.info("Successfully registered with Kong gateway");
        } catch (Exception e) {
            log.warn("Failed to register with Kong gateway: {}. Service will operate without gateway.", e.getMessage());
        }
    }

    /**
     * Generate Envoy sidecar configuration (for Istio/K8s deployments).
     */
    public Map<String, Object> generateEnvoyConfig() {
        return Map.of(
                "static_resources", Map.of(
                        "listeners", List.of(Map.of(
                                "name", "listener_0",
                                "address", Map.of("socket_address", Map.of("address", "0.0.0.0", "port_value", 10000)),
                                "filter_chains", List.of(Map.of(
                                        "filters", List.of(Map.of(
                                                "name", "envoy.filters.network.http_connection_manager",
                                                "typed_config", Map.of(
                                                        "route_config", Map.of(
                                                                "virtual_hosts", List.of(Map.of(
                                                                        "name", config.getServiceName(),
                                                                        "domains", List.of("*"),
                                                                        "routes", List.of(Map.of(
                                                                                "match", Map.of("prefix", "/"),
                                                                                "route", Map.of("cluster", config.getServiceName())
                                                                        ))
                                                                ))
                                                        )
                                                )
                                        ))
                                ))
                        )),
                        "clusters", List.of(Map.of(
                                "name", config.getServiceName(),
                                "type", "STRICT_DNS",
                                "lb_policy", "ROUND_ROBIN",
                                "load_assignment", Map.of(
                                        "cluster_name", config.getServiceName(),
                                        "endpoints", List.of(Map.of(
                                                "lb_endpoints", List.of(Map.of(
                                                        "endpoint", Map.of("address", Map.of("socket_address", Map.of(
                                                                "address", "127.0.0.1", "port_value", 8080
                                                        )))
                                                ))
                                        ))
                                )
                        ))
                )
        );
    }
}
