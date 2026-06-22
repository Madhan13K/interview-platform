package com.interview_platform_backend.interview_platform_backend.mobilesdk;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/mobile")
public class MobileSdkController {

    private final MobileSdkConfigService configService;

    public MobileSdkController(MobileSdkConfigService configService) {
        this.configService = configService;
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig(
            @RequestParam(defaultValue = "android") String platform,
            @RequestParam(required = false) String appVersion) {
        return ResponseEntity.ok(configService.getAppConfig(platform, appVersion));
    }

    @PostMapping("/register-device")
    public ResponseEntity<Map<String, Object>> registerDevice(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(configService.registerDevice(
                request.get("userId"),
                request.get("fcmToken"),
                request.getOrDefault("platform", "android"),
                request.getOrDefault("deviceInfo", "")
        ));
    }

    @GetMapping("/features")
    public ResponseEntity<Map<String, Boolean>> getFeatures(
            @RequestParam(defaultValue = "android") String platform) {
        return ResponseEntity.ok(configService.getEnabledFeatures(platform));
    }
}
