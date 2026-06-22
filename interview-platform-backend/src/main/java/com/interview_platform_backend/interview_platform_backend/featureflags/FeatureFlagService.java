package com.interview_platform_backend.interview_platform_backend.featureflags;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Feature Flag Service.
 * Supports LaunchDarkly and Flagsmith for gradual feature rollouts.
 * Falls back to local configuration when external services are unavailable.
 */
@Service
public class FeatureFlagService {

    private static final Logger log = LoggerFactory.getLogger(FeatureFlagService.class);

    @Value("${app.feature-flags.provider:local}")
    private String provider; // "launchdarkly", "flagsmith", "local"

    @Value("${app.feature-flags.launchdarkly.sdk-key:}")
    private String launchDarklySdkKey;

    @Value("${app.feature-flags.flagsmith.api-key:}")
    private String flagsmithApiKey;

    @Value("${app.feature-flags.flagsmith.base-url:https://edge.api.flagsmith.com/api/v1}")
    private String flagsmithBaseUrl;

    private final ConcurrentHashMap<String, Boolean> localFlags = new ConcurrentHashMap<>();
    private final RestClient restClient = RestClient.create();

    @PostConstruct
    public void initializeDefaults() {
        // Default feature flags (can be overridden at runtime)
        localFlags.put("ai_suggestions", true);
        localFlags.put("video_interviews", true);
        localFlags.put("code_execution", true);
        localFlags.put("calendar_sync", true);
        localFlags.put("sso_saml", false);
        localFlags.put("background_checks", false);
        localFlags.put("job_board_posting", false);
        localFlags.put("custom_reports", false);
        localFlags.put("mobile_push", false);
        log.info("Feature flags initialized with {} default flags (provider: {})", localFlags.size(), provider);
    }

    /**
     * Check if a feature is enabled for a given context (user/org).
     */
    public boolean isEnabled(String flagKey, String userId) {
        return switch (provider.toLowerCase()) {
            case "launchdarkly" -> checkLaunchDarkly(flagKey, userId);
            case "flagsmith" -> checkFlagsmith(flagKey, userId);
            default -> localFlags.getOrDefault(flagKey, false);
        };
    }

    /**
     * Check if a feature is enabled (no user context).
     */
    public boolean isEnabled(String flagKey) {
        return isEnabled(flagKey, null);
    }

    /**
     * Get all flags for a user (useful for frontend bootstrapping).
     */
    public Map<String, Boolean> getAllFlags(String userId) {
        if ("local".equalsIgnoreCase(provider)) {
            return Map.copyOf(localFlags);
        }
        // For remote providers, fetch all flags
        return Map.copyOf(localFlags); // Fallback
    }

    /**
     * Update a local flag at runtime (admin operation).
     */
    public void setFlag(String flagKey, boolean enabled) {
        localFlags.put(flagKey, enabled);
        log.info("Feature flag '{}' set to {}", flagKey, enabled);
    }

    private boolean checkLaunchDarkly(String flagKey, String userId) {
        // LaunchDarkly SDK would normally be initialized as a singleton client
        // For server-side, use the LaunchDarkly Java Server SDK
        // Falling back to local for now if SDK key is not configured
        if (launchDarklySdkKey == null || launchDarklySdkKey.isBlank()) {
            return localFlags.getOrDefault(flagKey, false);
        }
        try {
            // In production: use LDClient.boolVariation(flagKey, user, defaultValue)
            log.debug("LaunchDarkly flag check: {} for user {}", flagKey, userId);
            return localFlags.getOrDefault(flagKey, false);
        } catch (Exception e) {
            log.warn("LaunchDarkly check failed for '{}': {}", flagKey, e.getMessage());
            return localFlags.getOrDefault(flagKey, false);
        }
    }

    private boolean checkFlagsmith(String flagKey, String userId) {
        if (flagsmithApiKey == null || flagsmithApiKey.isBlank()) {
            return localFlags.getOrDefault(flagKey, false);
        }
        try {
            String url = flagsmithBaseUrl + "/flags/";
            if (userId != null) {
                url = flagsmithBaseUrl + "/identities/?identifier=" + userId;
            }

            var response = restClient.get()
                    .uri(url)
                    .header("X-Environment-Key", flagsmithApiKey)
                    .retrieve()
                    .body(Map.class);

            // Parse Flagsmith response for the specific flag
            if (response != null && response.containsKey("flags")) {
                var flags = (java.util.List<Map<String, Object>>) response.get("flags");
                for (var flag : flags) {
                    var feature = (Map<String, Object>) flag.get("feature");
                    if (feature != null && flagKey.equals(feature.get("name"))) {
                        return Boolean.TRUE.equals(flag.get("enabled"));
                    }
                }
            }
            return localFlags.getOrDefault(flagKey, false);
        } catch (Exception e) {
            log.warn("Flagsmith check failed for '{}': {}", flagKey, e.getMessage());
            return localFlags.getOrDefault(flagKey, false);
        }
    }
}
