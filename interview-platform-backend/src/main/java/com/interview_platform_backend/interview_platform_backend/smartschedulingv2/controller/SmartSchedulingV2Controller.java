package com.interview_platform_backend.interview_platform_backend.smartschedulingv2.controller;

import com.interview_platform_backend.interview_platform_backend.smartschedulingv2.service.SmartSchedulingV2Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/smart-scheduling")
@RequiredArgsConstructor
public class SmartSchedulingV2Controller {

    private final SmartSchedulingV2Service schedulingService;

    @GetMapping("/optimal-slot")
    public ResponseEntity<Map<String, Object>> findOptimalSlot(
            @RequestParam UUID interviewerId,
            @RequestParam UUID candidateId,
            @RequestParam int durationMinutes) {
        Map<String, Object> result = schedulingService.findOptimalSlot(interviewerId, candidateId, durationMinutes);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/reschedule/{interviewId}")
    public ResponseEntity<Map<String, Object>> suggestReschedule(@PathVariable UUID interviewId) {
        Map<String, Object> result = schedulingService.suggestReschedule(interviewId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/no-show-risk")
    public ResponseEntity<Map<String, Object>> calculateNoShowRisk(
            @RequestParam UUID candidateId,
            @RequestParam Instant proposedTime) {
        Map<String, Object> result = schedulingService.calculateNoShowRisk(candidateId, proposedTime);
        return ResponseEntity.ok(result);
    }
}
