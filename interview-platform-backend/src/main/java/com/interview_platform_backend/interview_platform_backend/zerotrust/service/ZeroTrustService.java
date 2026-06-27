package com.interview_platform_backend.interview_platform_backend.zerotrust.service;

import com.interview_platform_backend.interview_platform_backend.zerotrust.config.ZeroTrustConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "app.zero-trust.enabled", havingValue = "true")
public class ZeroTrustService {
    private static final Logger log = LoggerFactory.getLogger(ZeroTrustService.class);
    private final ZeroTrustConfig config;

    public ZeroTrustService(ZeroTrustConfig config) {
        this.config = config;
    }

    public boolean validateServiceIdentity(String serviceName, String certificate) {
        if (!config.getAllowedServices().contains(serviceName)) {
            log.warn("Zero Trust: Rejected request from unknown service: {}", serviceName);
            return false;
        }
        log.debug("Zero Trust: Validated service identity: {}", serviceName);
        return true;
    }

    public Map<String, Object> getNetworkPolicy() {
        return Map.of(
            "apiVersion", "security.istio.io/v1beta1",
            "kind", "AuthorizationPolicy",
            "metadata", Map.of("name", "interview-platform-policy", "namespace", "interview-platform"),
            "spec", Map.of(
                "action", "ALLOW",
                "rules", List.of(Map.of(
                    "from", List.of(Map.of("source", Map.of("principals",
                        config.getAllowedServices().stream()
                            .map(s -> "cluster.local/ns/interview-platform/sa/" + s)
                            .toList()))),
                    "to", List.of(Map.of("operation", Map.of("methods",
                        List.of("GET", "POST", "PUT", "DELETE", "PATCH"))))
                ))
            )
        );
    }

    public Map<String, Object> getCertStatus() {
        Instant nextRotation = Instant.now().plus(config.getCertRotationDays(), ChronoUnit.DAYS);
        return Map.of(
            "mtlsEnabled", config.isMtlsEnabled(),
            "serviceMesh", config.getServiceMesh(),
            "nextCertRotation", nextRotation.toString(),
            "allowedServices", config.getAllowedServices(),
            "networkPolicies", config.isNetworkPoliciesEnabled()
        );
    }
}
