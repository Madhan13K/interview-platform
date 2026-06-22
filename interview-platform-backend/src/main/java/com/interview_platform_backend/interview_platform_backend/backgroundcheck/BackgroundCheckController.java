package com.interview_platform_backend.interview_platform_backend.backgroundcheck;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/background-checks")
@PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
@ConditionalOnProperty(name = "app.background-check.enabled", havingValue = "true")
public class BackgroundCheckController {

    private final BackgroundCheckService backgroundCheckService;

    public BackgroundCheckController(BackgroundCheckService backgroundCheckService) {
        this.backgroundCheckService = backgroundCheckService;
    }

    @PostMapping("/initiate")
    public ResponseEntity<BackgroundCheckService.BackgroundCheckResult> initiate(@RequestBody Map<String, String> request) {
        var result = backgroundCheckService.initiateCheck(
                request.get("candidateEmail"),
                request.get("candidateName"),
                request.getOrDefault("packageType", "standard")
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{checkId}/status")
    public ResponseEntity<BackgroundCheckService.BackgroundCheckResult> getStatus(@PathVariable String checkId) {
        return ResponseEntity.ok(backgroundCheckService.getStatus(checkId));
    }
}
