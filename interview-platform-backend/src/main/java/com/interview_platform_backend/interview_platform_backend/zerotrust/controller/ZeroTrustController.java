package com.interview_platform_backend.interview_platform_backend.zerotrust.controller;

import com.interview_platform_backend.interview_platform_backend.zerotrust.service.ZeroTrustService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/zero-trust")
@PreAuthorize("hasRole('ADMIN')")
@ConditionalOnProperty(name = "app.zero-trust.enabled", havingValue = "true")
@RequiredArgsConstructor
public class ZeroTrustController {

    private final ZeroTrustService zeroTrustService;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        log.info("REST: Fetching zero trust status");
        return ResponseEntity.ok(zeroTrustService.getCertStatus());
    }

    @GetMapping("/network-policy")
    public ResponseEntity<Map<String, Object>> getNetworkPolicy() {
        log.info("REST: Fetching network policy");
        return ResponseEntity.ok(zeroTrustService.getNetworkPolicy());
    }

    @PostMapping("/validate-service")
    public ResponseEntity<Map<String, Object>> validateService(@RequestBody Map<String, String> body) {
        String serviceName = body.get("serviceName");
        String certificate = body.get("certificate");
        log.info("REST: Validating service identity: {}", serviceName);

        boolean valid = zeroTrustService.validateServiceIdentity(serviceName, certificate);
        return ResponseEntity.ok(Map.of(
            "serviceName", serviceName,
            "valid", valid,
            "message", valid ? "Service identity validated" : "Service not in allowed list"
        ));
    }
}
