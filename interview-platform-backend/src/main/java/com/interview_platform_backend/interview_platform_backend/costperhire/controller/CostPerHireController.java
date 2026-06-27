package com.interview_platform_backend.interview_platform_backend.costperhire.controller;

import com.interview_platform_backend.interview_platform_backend.costperhire.entity.HiringCost;
import com.interview_platform_backend.interview_platform_backend.costperhire.service.CostPerHireService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cost-per-hire")
@RequiredArgsConstructor
public class CostPerHireController {

    private final CostPerHireService costPerHireService;

    @PostMapping
    public ResponseEntity<HiringCost> addCost(@RequestBody HiringCost cost) {
        HiringCost saved = costPerHireService.addCost(cost);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/position/{jobId}")
    public ResponseEntity<List<HiringCost>> getCostsForPosition(@PathVariable UUID jobId) {
        List<HiringCost> costs = costPerHireService.getCostsForPosition(jobId);
        return ResponseEntity.ok(costs);
    }

    @GetMapping("/position/{jobId}/calculate")
    public ResponseEntity<Map<String, Object>> calculateCostPerHire(@PathVariable UUID jobId) {
        Map<String, Object> result = costPerHireService.calculateCostPerHire(jobId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/org/{orgId}/average")
    public ResponseEntity<Map<String, Object>> getAvgCostPerHire(@PathVariable UUID orgId) {
        Map<String, Object> result = costPerHireService.getAvgCostPerHire(orgId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/org/{orgId}/breakdown")
    public ResponseEntity<Map<String, Double>> getCostBreakdown(@PathVariable UUID orgId,
                                                                 @RequestParam Instant since) {
        Map<String, Double> breakdown = costPerHireService.getCostBreakdown(orgId, since);
        return ResponseEntity.ok(breakdown);
    }

    @GetMapping("/org/{orgId}/top-expenses")
    public ResponseEntity<List<Map.Entry<String, Double>>> getTopExpenseCategories(@PathVariable UUID orgId) {
        List<Map.Entry<String, Double>> top = costPerHireService.getTopExpenseCategories(orgId);
        return ResponseEntity.ok(top);
    }
}
