package com.interview_platform_backend.interview_platform_backend.pooltuning.controller;

import com.interview_platform_backend.interview_platform_backend.pooltuning.config.ConnectionPoolTuningConfig;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/pool-tuning")
@ConditionalOnProperty(name = "app.pool-tuning.enabled", havingValue = "true")
@PreAuthorize("hasRole('ADMIN')")
public class PoolTuningController {

    private final ConnectionPoolTuningConfig config;
    private final DataSource dataSource;

    public PoolTuningController(ConnectionPoolTuningConfig config, DataSource dataSource) {
        this.config = config;
        this.dataSource = dataSource;
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        return ResponseEntity.ok(config.getPoolMetrics(dataSource));
    }

    @PostMapping("/adjust")
    public ResponseEntity<Map<String, String>> adjustPool(@RequestParam int maxSize) {
        config.adjustPoolSize(dataSource, maxSize);
        return ResponseEntity.ok(Map.of("status", "adjusted", "newMaxSize", String.valueOf(maxSize)));
    }
}
