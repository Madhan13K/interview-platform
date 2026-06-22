package com.interview_platform_backend.interview_platform_backend.slatracking;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/sla")
@PreAuthorize("hasAnyRole('ADMIN', 'RECRUITER')")
public class RecruiterSlaController {

    private final RecruiterSlaService slaService;

    public RecruiterSlaController(RecruiterSlaService slaService) {
        this.slaService = slaService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<List<RecruiterSlaService.RecruiterSlaMetrics>> getMetrics() {
        return ResponseEntity.ok(slaService.calculateAllRecruiterMetrics());
    }

    @GetMapping("/workload")
    public ResponseEntity<Map<String, Object>> getWorkloadDistribution() {
        return ResponseEntity.ok(slaService.getWorkloadDistribution());
    }

    @GetMapping("/bottlenecks")
    public ResponseEntity<Map<String, Object>> getBottlenecks() {
        return ResponseEntity.ok(slaService.identifyBottlenecks());
    }
}
