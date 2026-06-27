package com.interview_platform_backend.interview_platform_backend.notificationpreferences.controller;

import com.interview_platform_backend.interview_platform_backend.notificationpreferences.entity.NotificationPreference;
import com.interview_platform_backend.interview_platform_backend.notificationpreferences.service.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notification-preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final NotificationPreferenceService notificationPreferenceService;

    @GetMapping("/{userId}")
    public ResponseEntity<NotificationPreference> getPreferences(@PathVariable UUID userId) {
        NotificationPreference prefs = notificationPreferenceService.getPreferences(userId);
        return ResponseEntity.ok(prefs);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<NotificationPreference> updatePreferences(
            @PathVariable UUID userId,
            @RequestBody NotificationPreference preferences) {
        NotificationPreference updated = notificationPreferenceService.updatePreferences(userId, preferences);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{userId}/should-send")
    public ResponseEntity<Map<String, Object>> shouldSend(
            @PathVariable UUID userId,
            @RequestParam String channel,
            @RequestParam(required = false) String category) {
        boolean result = notificationPreferenceService.shouldSend(userId, channel, category);
        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "channel", channel,
                "shouldSend", result
        ));
    }

    @GetMapping("/{userId}/quiet-hours")
    public ResponseEntity<Map<String, Object>> isQuietHours(@PathVariable UUID userId) {
        boolean quietHours = notificationPreferenceService.isQuietHours(userId);
        return ResponseEntity.ok(Map.of(
                "userId", userId,
                "isQuietHours", quietHours
        ));
    }
}
