package com.interview_platform_backend.interview_platform_backend.zerotrust.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import java.util.List;

@Configuration
@ConditionalOnProperty(name = "app.zero-trust.enabled", havingValue = "true")
public class ZeroTrustConfig {
    private static final Logger log = LoggerFactory.getLogger(ZeroTrustConfig.class);

    @Value("${app.zero-trust.mtls.enabled:true}")
    private boolean mtlsEnabled;

    @Value("${app.zero-trust.service-mesh:istio}")
    private String serviceMesh;

    @Value("${app.zero-trust.allowed-services:interview-platform,notification-service,code-execution-service}")
    private List<String> allowedServices;

    @Value("${app.zero-trust.network-policies.enabled:true}")
    private boolean networkPoliciesEnabled;

    @Value("${app.zero-trust.cert-rotation-days:30}")
    private int certRotationDays;

    @PostConstruct
    public void init() {
        log.info("Zero Trust Network configuration active:");
        log.info("  mTLS: {}, Service mesh: {}", mtlsEnabled, serviceMesh);
        log.info("  Allowed services: {}", allowedServices);
        log.info("  Network policies: {}, Cert rotation: {} days", networkPoliciesEnabled, certRotationDays);
    }

    public boolean isMtlsEnabled() { return mtlsEnabled; }
    public String getServiceMesh() { return serviceMesh; }
    public List<String> getAllowedServices() { return allowedServices; }
    public boolean isNetworkPoliciesEnabled() { return networkPoliciesEnabled; }
    public int getCertRotationDays() { return certRotationDays; }
}
