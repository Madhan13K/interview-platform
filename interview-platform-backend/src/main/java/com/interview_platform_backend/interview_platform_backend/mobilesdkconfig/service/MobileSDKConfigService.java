package com.interview_platform_backend.interview_platform_backend.mobilesdkconfig.service;

import com.interview_platform_backend.interview_platform_backend.mobilesdkconfig.dto.MobileAppConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class MobileSDKConfigService {

    @Value("${app.mobile.min-version:1.0.0}")
    private String minVersion;

    @Value("${app.mobile.force-update:false}")
    private boolean forceUpdate;

    @Value("${app.mobile.maintenance:false}")
    private boolean maintenanceMode;

    @Value("${app.mobile.api-url:https://api.interview-platform.app}")
    private String apiUrl;

    @Value("${app.mobile.ws-url:wss://api.interview-platform.app/ws}")
    private String wsUrl;

    public MobileAppConfig getConfig(String platform, String currentVersion) {
        Map<String, Boolean> features = Map.of(
                "video_interviews", true,
                "code_editor", true,
                "push_notifications", true,
                "biometric_login", true,
                "offline_mode", false,
                "dark_mode", true,
                "webauthn", true,
                "ai_chatbot", true
        );

        Map<String, String> deepLinks = Map.of(
                "interview", "/interviews/{id}",
                "dashboard", "/dashboard",
                "profile", "/profile",
                "schedule", "/scheduling"
        );

        Map<String, String> theme = Map.of(
                "primaryColor", "#4F46E5",
                "secondaryColor", "#7C3AED",
                "backgroundColor", "#FFFFFF",
                "textColor", "#1F2937"
        );

        return MobileAppConfig.builder()
                .appVersion("2.0.0")
                .minSupportedVersion(minVersion)
                .forceUpdate(forceUpdate)
                .maintenanceMode(maintenanceMode)
                .features(features)
                .apiBaseUrl(apiUrl)
                .wsBaseUrl(wsUrl)
                .deepLinks(deepLinks)
                .pushConfig(Map.of("enabled", true, "provider", "fcm"))
                .theme(theme)
                .build();
    }
}
