package com.interview_platform_backend.interview_platform_backend.mobilesdk;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Mobile SDK Configuration Service.
 * Provides configuration endpoints for React Native / Flutter mobile apps.
 * Handles device registration, push token management, and mobile-specific settings.
 */
@Service
public class MobileSdkConfigService {

    @Value("${app.mobile.min-version:1.0.0}")
    private String minAppVersion;

    @Value("${app.mobile.force-update:false}")
    private boolean forceUpdate;

    @Value("${app.mobile.maintenance-mode:false}")
    private boolean maintenanceMode;

    /**
     * Get mobile app configuration (called on app startup).
     */
    public Map<String, Object> getAppConfig(String platform, String appVersion) {
        boolean needsUpdate = compareVersions(appVersion, minAppVersion) < 0;

        return Map.of(
                "minVersion", minAppVersion,
                "currentVersion", appVersion != null ? appVersion : "unknown",
                "needsUpdate", needsUpdate,
                "forceUpdate", forceUpdate && needsUpdate,
                "maintenanceMode", maintenanceMode,
                "features", getEnabledFeatures(platform),
                "apiBaseUrl", "https://api.interview-platform.com",
                "wsBaseUrl", "wss://api.interview-platform.com/ws",
                "supportedLanguages", List.of("en", "es", "fr", "de", "ja")
        );
    }

    /**
     * Register a mobile device for push notifications.
     */
    public Map<String, Object> registerDevice(String userId, String fcmToken, String platform, String deviceInfo) {
        // In production: save to device_registrations table
        return Map.of(
                "registered", true,
                "userId", userId,
                "platform", platform,
                "pushEnabled", true
        );
    }

    /**
     * Get mobile-specific feature flags.
     */
    public Map<String, Boolean> getEnabledFeatures(String platform) {
        Map<String, Boolean> features = new java.util.HashMap<>(Map.of(
                "video_interview", true,
                "code_editor", true,
                "push_notifications", true,
                "offline_mode", false,
                "biometric_login", true,
                "dark_mode", true,
                "haptic_feedback", "ios".equalsIgnoreCase(platform)
        ));
        return features;
    }

    private int compareVersions(String v1, String v2) {
        if (v1 == null || v2 == null) return 0;
        String[] parts1 = v1.split("\\.");
        String[] parts2 = v2.split("\\.");
        for (int i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            int p1 = i < parts1.length ? Integer.parseInt(parts1[i]) : 0;
            int p2 = i < parts2.length ? Integer.parseInt(parts2[i]) : 0;
            if (p1 != p2) return Integer.compare(p1, p2);
        }
        return 0;
    }
}
