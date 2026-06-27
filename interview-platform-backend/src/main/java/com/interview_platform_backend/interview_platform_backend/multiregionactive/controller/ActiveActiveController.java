package com.interview_platform_backend.interview_platform_backend.multiregionactive.controller;

import com.interview_platform_backend.interview_platform_backend.multiregionactive.service.ActiveActiveReplicationService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/active-active")
@ConditionalOnProperty(name = "app.active-active.enabled", havingValue = "true")
@PreAuthorize("hasRole('ADMIN')")
public class ActiveActiveController {
    private final ActiveActiveReplicationService service;
    public ActiveActiveController(ActiveActiveReplicationService service) { this.service = service; }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() { return ResponseEntity.ok(service.getStatus()); }

    @GetMapping("/pending")
    public ResponseEntity<List<Map<String, Object>>> getPending() { return ResponseEntity.ok(service.getPendingReplications()); }
}
