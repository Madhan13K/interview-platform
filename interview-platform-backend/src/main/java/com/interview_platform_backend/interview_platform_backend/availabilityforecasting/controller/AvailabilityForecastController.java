package com.interview_platform_backend.interview_platform_backend.availabilityforecasting.controller;

import com.interview_platform_backend.interview_platform_backend.availabilityforecasting.entity.AvailabilityForecast;
import com.interview_platform_backend.interview_platform_backend.availabilityforecasting.service.AvailabilityForecastService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/availability-forecast")
@RequiredArgsConstructor
public class AvailabilityForecastController {

    private final AvailabilityForecastService availabilityForecastService;

    @PostMapping("/generate/{interviewerId}")
    public ResponseEntity<List<AvailabilityForecast>> generateForecast(
            @PathVariable UUID interviewerId,
            @RequestParam(defaultValue = "7") int daysAhead) {
        log.info("POST /api/v1/availability-forecast/generate/{} daysAhead={}", interviewerId, daysAhead);
        List<AvailabilityForecast> forecasts = availabilityForecastService.generateForecast(interviewerId, daysAhead);
        return ResponseEntity.ok(forecasts);
    }

    @GetMapping("/conflicts/{interviewerId}")
    public ResponseEntity<Map<String, Object>> getConflicts(
            @PathVariable UUID interviewerId,
            @RequestParam Instant proposedTime) {
        log.info("GET /api/v1/availability-forecast/conflicts/{} proposedTime={}", interviewerId, proposedTime);
        Map<String, Object> conflicts = availabilityForecastService.getConflicts(interviewerId, proposedTime);
        return ResponseEntity.ok(conflicts);
    }

    @PostMapping("/best-slots")
    public ResponseEntity<List<Map<String, Object>>> getBestSlotsForTeam(
            @RequestBody List<UUID> interviewerIds,
            @RequestParam(defaultValue = "7") int daysAhead) {
        log.info("POST /api/v1/availability-forecast/best-slots for {} interviewers", interviewerIds.size());
        List<Map<String, Object>> bestSlots = availabilityForecastService.getBestSlotsForTeam(interviewerIds, daysAhead);
        return ResponseEntity.ok(bestSlots);
    }
}
