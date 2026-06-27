package com.interview_platform_backend.interview_platform_backend.mobilesdkconfig.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MobileAppConfig {

    private String appVersion;
    private String minSupportedVersion;
    private boolean forceUpdate;
    private boolean maintenanceMode;
    private Map<String, Boolean> features;
    private String apiBaseUrl;
    private String wsBaseUrl;
    private Map<String, String> deepLinks;
    private Map<String, Object> pushConfig;
    private Map<String, String> theme;
}
