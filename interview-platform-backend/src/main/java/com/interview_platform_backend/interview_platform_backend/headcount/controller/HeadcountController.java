package com.interview_platform_backend.interview_platform_backend.headcount.controller;

import com.interview_platform_backend.interview_platform_backend.headcount.entity.HeadcountPlan;
import com.interview_platform_backend.interview_platform_backend.headcount.service.HeadcountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/headcount")
@RequiredArgsConstructor
public class HeadcountController {

    private final HeadcountService headcountService;

    @PostMapping
    public ResponseEntity<HeadcountPlan> createPlan(@RequestBody HeadcountPlan plan) {
        return ResponseEntity.ok(headcountService.createPlan(plan));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HeadcountPlan> getById(@PathVariable UUID id) {
        HeadcountPlan plan = headcountService.getById(id);
        if (plan == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(plan);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HeadcountPlan> updatePlan(@PathVariable UUID id, @RequestBody HeadcountPlan plan) {
        return ResponseEntity.ok(headcountService.updatePlan(id, plan));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<HeadcountPlan> approvePlan(@PathVariable UUID id, @RequestParam UUID approvedBy) {
        return ResponseEntity.ok(headcountService.approvePlan(id, approvedBy));
    }

    @GetMapping("/{id}/forecast")
    public ResponseEntity<Map<String, Object>> getForecast(@PathVariable UUID id) {
        return ResponseEntity.ok(headcountService.getForecast(id));
    }

    @GetMapping("/department/{department}")
    public ResponseEntity<List<HeadcountPlan>> getByDepartment(@PathVariable String department) {
        return ResponseEntity.ok(headcountService.getByDepartment(department));
    }

    @GetMapping("/quarter/{quarter}")
    public ResponseEntity<List<HeadcountPlan>> getByQuarter(@PathVariable String quarter) {
        return ResponseEntity.ok(headcountService.getByQuarter(quarter));
    }
}
