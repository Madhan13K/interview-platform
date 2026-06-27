package com.interview_platform_backend.interview_platform_backend.compensationbenchmark.controller;

import com.interview_platform_backend.interview_platform_backend.compensationbenchmark.entity.CompensationBenchmark;
import com.interview_platform_backend.interview_platform_backend.compensationbenchmark.service.CompensationBenchmarkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/compensation-benchmarks")
@RequiredArgsConstructor
public class CompensationBenchmarkController {

    private final CompensationBenchmarkService compensationBenchmarkService;

    @GetMapping
    public ResponseEntity<CompensationBenchmark> getBenchmark(
            @RequestParam String role,
            @RequestParam String level,
            @RequestParam String location) {
        log.info("GET /api/v1/compensation-benchmarks?role={}&level={}&location={}", role, level, location);
        CompensationBenchmark benchmark = compensationBenchmarkService.getBenchmark(role, level, location);
        if (benchmark == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(benchmark);
    }

    @GetMapping("/compare")
    public ResponseEntity<Map<String, Object>> compareOffer(
            @RequestParam double salary,
            @RequestParam String role,
            @RequestParam String level,
            @RequestParam String location) {
        log.info("GET /api/v1/compensation-benchmarks/compare?salary={}&role={}&level={}&location={}", salary, role, level, location);
        Map<String, Object> result = compensationBenchmarkService.compareOffer(salary, role, level, location);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/trend")
    public ResponseEntity<List<CompensationBenchmark>> getMarketTrend(
            @RequestParam String role,
            @RequestParam String level) {
        log.info("GET /api/v1/compensation-benchmarks/trend?role={}&level={}", role, level);
        return ResponseEntity.ok(compensationBenchmarkService.getMarketTrend(role, level));
    }

    @PostMapping("/bulk-import")
    public ResponseEntity<List<CompensationBenchmark>> bulkImport(@RequestBody List<CompensationBenchmark> benchmarks) {
        log.info("POST /api/v1/compensation-benchmarks/bulk-import - {} items", benchmarks.size());
        List<CompensationBenchmark> imported = compensationBenchmarkService.bulkImport(benchmarks);
        return ResponseEntity.status(HttpStatus.CREATED).body(imported);
    }
}
