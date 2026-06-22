package com.interview_platform_backend.interview_platform_backend.featureflags;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/feature-flags")
public class FeatureFlagController {

    private final FeatureFlagService featureFlagService;

    public FeatureFlagController(FeatureFlagService featureFlagService) {
        this.featureFlagService = featureFlagService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Boolean>> getAllFlags(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(featureFlagService.getAllFlags(UUID.fromString(userDetails.getUsername()).toString()));
    }

    @GetMapping("/{flagKey}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> checkFlag(
            @PathVariable String flagKey,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean enabled = featureFlagService.isEnabled(flagKey, UUID.fromString(userDetails.getUsername()).toString());
        return ResponseEntity.ok(Map.of("flag", flagKey, "enabled", enabled));
    }

    @PutMapping("/{flagKey}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> setFlag(
            @PathVariable String flagKey,
            @RequestBody Map<String, Boolean> body) {
        boolean enabled = body.getOrDefault("enabled", false);
        featureFlagService.setFlag(flagKey, enabled);
        return ResponseEntity.ok(Map.of("flag", flagKey, "enabled", enabled));
    }
}
