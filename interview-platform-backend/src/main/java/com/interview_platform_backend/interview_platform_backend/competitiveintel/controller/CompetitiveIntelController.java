package com.interview_platform_backend.interview_platform_backend.competitiveintel.controller;

import com.interview_platform_backend.interview_platform_backend.competitiveintel.entity.CompetitorData;
import com.interview_platform_backend.interview_platform_backend.competitiveintel.service.CompetitiveIntelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/competitive-intel")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class CompetitiveIntelController {

    private final CompetitiveIntelService competitiveIntelService;

    @PostMapping("/data")
    public ResponseEntity<CompetitorData> addDataPoint(@RequestBody CompetitorData data) {
        CompetitorData saved = competitiveIntelService.addDataPoint(data);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/competitor/{name}")
    public ResponseEntity<List<CompetitorData>> getByCompetitor(@PathVariable String name) {
        return ResponseEntity.ok(competitiveIntelService.getByCompetitor(name));
    }

    @GetMapping("/salaries")
    public ResponseEntity<List<CompetitorData>> compareSalaries(
            @RequestParam String role,
            @RequestParam(required = false) String location) {
        return ResponseEntity.ok(competitiveIntelService.compareSalaries(role, location));
    }

    @GetMapping("/hiring-trends/{competitor}")
    public ResponseEntity<List<CompetitorData>> getHiringTrends(@PathVariable String competitor) {
        return ResponseEntity.ok(competitiveIntelService.getHiringTrends(competitor));
    }

    @GetMapping("/benchmarks/{role}")
    public ResponseEntity<List<CompetitorData>> getMarketBenchmarks(@PathVariable String role) {
        return ResponseEntity.ok(competitiveIntelService.getMarketBenchmarks(role));
    }
}
