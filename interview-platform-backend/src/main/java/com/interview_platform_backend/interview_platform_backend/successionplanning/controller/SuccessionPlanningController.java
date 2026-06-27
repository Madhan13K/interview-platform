package com.interview_platform_backend.interview_platform_backend.successionplanning.controller;

import com.interview_platform_backend.interview_platform_backend.successionplanning.entity.SuccessionPlan;
import com.interview_platform_backend.interview_platform_backend.successionplanning.service.SuccessionPlanningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/succession-plans")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SuccessionPlanningController {

    private final SuccessionPlanningService successionPlanningService;

    @PostMapping
    public ResponseEntity<SuccessionPlan> createPlan(@RequestBody SuccessionPlan plan) {
        log.info("POST /api/v1/succession-plans - Creating plan for position: {}", plan.getPositionTitle());
        SuccessionPlan created = successionPlanningService.createPlan(plan);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/successors")
    public ResponseEntity<SuccessionPlan> addSuccessor(
            @PathVariable UUID id,
            @RequestBody String successorJson) {
        log.info("POST /api/v1/succession-plans/{}/successors", id);
        SuccessionPlan updated = successionPlanningService.addSuccessor(id, successorJson);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/readiness")
    public ResponseEntity<SuccessionPlan> assessReadiness(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        log.info("PUT /api/v1/succession-plans/{}/readiness", id);
        UUID userId = UUID.fromString(body.get("userId"));
        String readinessLevel = body.get("readiness");
        SuccessionPlan updated = successionPlanningService.assessReadiness(id, userId, readinessLevel);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/high-risk")
    public ResponseEntity<List<SuccessionPlan>> getHighRiskPositions() {
        log.info("GET /api/v1/succession-plans/high-risk");
        return ResponseEntity.ok(successionPlanningService.getHighRiskPositions());
    }

    @GetMapping("/department/{department}")
    public ResponseEntity<List<SuccessionPlan>> getByDepartment(@PathVariable String department) {
        log.info("GET /api/v1/succession-plans/department/{}", department);
        return ResponseEntity.ok(successionPlanningService.getByDepartment(department));
    }
}
