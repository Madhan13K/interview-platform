package com.interview_platform_backend.interview_platform_backend.notificationbus.controller;

import com.interview_platform_backend.interview_platform_backend.notificationbus.service.UnifiedNotificationBus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notification-bus")
@PreAuthorize("hasRole('ADMIN')")
public class NotificationBusController {

    private final UnifiedNotificationBus bus;

    public NotificationBusController(UnifiedNotificationBus bus) {
        this.bus = bus;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(bus.getStats());
    }
}
