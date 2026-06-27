package com.interview_platform_backend.interview_platform_backend.dlp.controller;

import com.interview_platform_backend.interview_platform_backend.dlp.dto.DlpViolation;
import com.interview_platform_backend.interview_platform_backend.dlp.entity.DlpIncident;
import com.interview_platform_backend.interview_platform_backend.dlp.entity.DlpPolicy;
import com.interview_platform_backend.interview_platform_backend.dlp.service.DlpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dlp")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class DlpController {

    private final DlpService dlpService;

    @GetMapping("/policies")
    public ResponseEntity<List<DlpPolicy>> getActivePolicies() {
        return ResponseEntity.ok(dlpService.getActivePolicies());
    }

    @PostMapping("/policies")
    public ResponseEntity<DlpPolicy> createPolicy(@RequestBody DlpPolicy policy) {
        DlpPolicy created = dlpService.createPolicy(policy);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/policies/{id}/toggle")
    public ResponseEntity<DlpPolicy> togglePolicy(@PathVariable UUID id) {
        DlpPolicy toggled = dlpService.togglePolicy(id);
        return ResponseEntity.ok(toggled);
    }

    @PostMapping("/scan")
    public ResponseEntity<List<DlpViolation>> scanContent(@RequestBody String content) {
        List<DlpViolation> violations = dlpService.scanContent(content);
        return ResponseEntity.ok(violations);
    }

    @GetMapping("/incidents")
    public ResponseEntity<List<DlpIncident>> getIncidents(
            @RequestParam(required = false) UUID userId) {
        if (userId != null) {
            return ResponseEntity.ok(dlpService.getIncidentsByUser(userId));
        }
        return ResponseEntity.ok(dlpService.getIncidentsByUser(null));
    }

    @GetMapping("/incidents/stats")
    public ResponseEntity<Map<String, Object>> getIncidentStats(
            @RequestParam(required = false) Integer days) {
        int lookbackDays = (days != null) ? days : 30;
        Instant since = Instant.now().minus(lookbackDays, ChronoUnit.DAYS);
        return ResponseEntity.ok(dlpService.getIncidentStats(since));
    }

    @GetMapping("/policies/top-violated")
    public ResponseEntity<List<DlpPolicy>> getTopViolatedPolicies() {
        return ResponseEntity.ok(dlpService.getTopViolatedPolicies());
    }
}
