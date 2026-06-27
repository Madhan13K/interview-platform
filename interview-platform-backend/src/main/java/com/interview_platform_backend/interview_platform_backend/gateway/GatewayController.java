package com.interview_platform_backend.interview_platform_backend.gateway;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/gateway")
@ConditionalOnProperty(name = "app.gateway.enabled", havingValue = "true")
@PreAuthorize("hasRole('ADMIN')")
public class GatewayController {

    private final GatewayRegistrationService registrationService;
    private final GatewayConfig config;

    public GatewayController(GatewayRegistrationService registrationService, GatewayConfig config) {
        this.registrationService = registrationService;
        this.config = config;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register() {
        registrationService.registerWithKong();
        return ResponseEntity.ok(Map.of("status", "registered", "gateway", config.getGatewayType()));
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        return ResponseEntity.ok(Map.of(
                "type", config.getGatewayType(),
                "adminUrl", config.getAdminUrl(),
                "serviceName", config.getServiceName(),
                "rateLimitRps", config.getRateLimitRps(),
                "authCacheTtl", config.getAuthCacheTtl(),
                "canaryEnabled", config.isCanaryEnabled(),
                "canaryWeight", config.getCanaryWeight()
        ));
    }

    @GetMapping("/envoy-config")
    public ResponseEntity<Map<String, Object>> getEnvoyConfig() {
        return ResponseEntity.ok(registrationService.generateEnvoyConfig());
    }
}
