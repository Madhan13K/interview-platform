package com.interview_platform_backend.interview_platform_backend.mobilesdkconfig.controller;

import com.interview_platform_backend.interview_platform_backend.mobilesdkconfig.dto.MobileAppConfig;
import com.interview_platform_backend.interview_platform_backend.mobilesdkconfig.service.MobileSDKConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/mobile")
public class MobileSDKConfigController {

    private final MobileSDKConfigService mobileSDKConfigService;

    public MobileSDKConfigController(MobileSDKConfigService mobileSDKConfigService) {
        this.mobileSDKConfigService = mobileSDKConfigService;
    }

    /**
     * Public endpoint for mobile app bootstrap configuration.
     * No authentication required - used during app initialization.
     */
    @GetMapping("/config")
    public ResponseEntity<MobileAppConfig> getConfig(
            @RequestParam(defaultValue = "ios") String platform,
            @RequestParam(defaultValue = "1.0.0") String version) {
        MobileAppConfig config = mobileSDKConfigService.getConfig(platform, version);
        return ResponseEntity.ok(config);
    }
}
