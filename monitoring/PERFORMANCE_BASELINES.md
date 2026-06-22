# Performance Baseline Metrics & Alerting Thresholds

## Baseline Metrics (Established from Load Tests)

### API Response Times

| Endpoint Category | p50 | p95 | p99 | Max Allowed |
|-------------------|-----|-----|-----|-------------|
| Auth (login/register) | <100ms | <500ms | <1000ms | 2000ms |
| CRUD (GET single) | <50ms | <200ms | <500ms | 1000ms |
| CRUD (GET list) | <100ms | <500ms | <1000ms | 2000ms |
| CRUD (POST create) | <100ms | <300ms | <800ms | 1500ms |
| Search (full-text) | <200ms | <800ms | <1500ms | 3000ms |
| Report generation | <500ms | <2000ms | <5000ms | 10000ms |
| File upload | <300ms | <2000ms | <5000ms | 30000ms |
| Code execution | <1000ms | <5000ms | <10000ms | 30000ms |
| AI (OpenAI call) | <2000ms | <5000ms | <8000ms | 15000ms |
| WebSocket connect | <200ms | <1000ms | <2000ms | 5000ms |

### Throughput

| Scenario | Baseline | Minimum Acceptable |
|----------|----------|-------------------|
| Concurrent interviews (WebSocket) | 100 connections | 50 connections |
| API requests per second | 500 req/s | 200 req/s |
| Bulk schedule operations | 1000 in 30s | 1000 in 60s |
| Code editor saves (WebSocket) | 50 msg/s per room | 20 msg/s per room |
| Concurrent code executions | 50 containers | 20 containers |

### Resource Utilization

| Resource | Normal | Warning | Critical |
|----------|--------|---------|----------|
| JVM Heap Used | <60% | 70-85% | >85% |
| CPU Usage | <50% | 60-80% | >80% |
| DB Connection Pool | <60% active | 70-85% active | >85% active |
| Redis Memory | <50% | 60-80% | >80% |
| Disk Usage | <60% | 70-85% | >85% |
| Docker containers active | <15 | 15-25 | >25 |

---

## Alerting Thresholds Configuration

### Prometheus Alert Rules

```yaml
# File: monitoring/alerting-rules.yml
groups:
  - name: interview-platform-alerts
    rules:
      # ─── API Performance ─────────────────────────────────────
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API p95 response time > 2s"
          description: "{{ $labels.uri }} p95 latency is {{ $value }}s"

      - alert: CriticalResponseTime
        expr: histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m])) > 5
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "API p99 response time > 5s"

      # ─── Error Rates ─────────────────────────────────────────
      - alert: HighErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) / rate(http_server_requests_seconds_count[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Error rate > 1%"
          description: "5xx error rate is {{ $value | humanizePercentage }}"

      - alert: CriticalErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) / rate(http_server_requests_seconds_count[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Error rate > 5% - Immediate action required"

      # ─── Database ────────────────────────────────────────────
      - alert: DBConnectionPoolExhaustion
        expr: hikaricp_connections_active / hikaricp_connections_max > 0.85
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "HikariCP pool >85% utilized"
          description: "Active: {{ $value | humanizePercentage }}. Risk of connection exhaustion."

      - alert: DBSlowQueries
        expr: rate(spring_data_repository_invocations_seconds_sum[5m]) / rate(spring_data_repository_invocations_seconds_count[5m]) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Average DB query time > 1s"

      # ─── Redis ──────────────────────────────────────────────
      - alert: RedisConnectionFailure
        expr: up{job="redis"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis connection lost"

      - alert: RedisHighMemory
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage > 80%"

      # ─── JVM ────────────────────────────────────────────────
      - alert: JVMHeapPressure
        expr: jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "JVM heap usage > 85%"

      - alert: JVMGCPause
        expr: rate(jvm_gc_pause_seconds_sum[5m]) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "GC pauses consuming >500ms/5min"

      # ─── WebSocket ──────────────────────────────────────────
      - alert: WebSocketConnectionLimit
        expr: websocket_connections_active > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "WebSocket connections near limit (>80)"

      # ─── Security ───────────────────────────────────────────
      - alert: AccountLockoutSpike
        expr: rate(account_lockouts_total[10m]) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High account lockout rate - possible brute force attack"

      - alert: RateLimitExceeded
        expr: rate(rate_limit_exceeded_total[5m]) > 100
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "Rate limiting triggered >100 times in 5min"

      # ─── Kafka ──────────────────────────────────────────────
      - alert: KafkaConsumerLag
        expr: kafka_consumer_lag > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Kafka consumer lag > 1000 messages"

      # ─── Code Execution ─────────────────────────────────────
      - alert: CodeExecutionContainerLimit
        expr: code_execution_active_containers > 20
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Active code execution containers > 20"

      - alert: CodeExecutionTimeouts
        expr: rate(code_execution_timeouts_total[5m]) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Code execution timeouts > 5 per 5 minutes"

      # ─── Disk ───────────────────────────────────────────────
      - alert: DiskSpaceLow
        expr: node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} < 0.15
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space < 15% remaining"

      # ─── Application Health ─────────────────────────────────
      - alert: ApplicationDown
        expr: up{job="interview-platform"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Application is DOWN"

      - alert: HighRestartRate
        expr: changes(process_start_time_seconds[1h]) > 2
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Application restarted > 2 times in 1 hour"
```

---

## k6 Load Test Thresholds (CI/CD Pass/Fail)

These thresholds are enforced in the k6 test scripts. If any threshold fails, the CI pipeline fails.

| Test | Metric | Threshold | Action on Fail |
|------|--------|-----------|----------------|
| concurrent-interviews | ws_connect_time p95 | < 2000ms | Block deploy |
| concurrent-interviews | ws_connect_success rate | > 95% | Block deploy |
| bulk-schedule | schedule_time p95 | < 5000ms | Block deploy |
| bulk-schedule | db_pool_exhaustion count | < 10 | Block deploy |
| code-save-throughput | code_save_latency p95 | < 1000ms | Block deploy |
| code-save-throughput | message_delivery_rate | > 95% | Warn |
| concurrent-code-execution | execution_success rate | > 80% | Warn |
| concurrent-code-execution | timeout_errors count | < 25 | Warn |
| rate-limiter-stress | rate_limit_accuracy rate | > 90% | Block deploy |
| rate-limiter-stress | response_time p95 | < 1000ms | Warn |

---

## Running Performance Tests

### Local (Development)
```bash
# Start backend
cd interview-platform-backend && docker compose up -d && ./mvnw spring-boot:run

# Run individual test
k6 run load-tests/concurrent-interviews.js

# Run all with reduced load (CI mode)
k6 run --vus 10 --duration 30s load-tests/rate-limiter-stress.js
k6 run --vus 5 --iterations 50 load-tests/bulk-schedule.js
```

### Staging (Full Load)
```bash
BASE_URL=https://staging-backend.onrender.com k6 run load-tests/concurrent-interviews.js
BASE_URL=https://staging-backend.onrender.com k6 run load-tests/bulk-schedule.js
BASE_URL=https://staging-backend.onrender.com k6 run load-tests/code-save-throughput.js
BASE_URL=https://staging-backend.onrender.com k6 run load-tests/concurrent-code-execution.js
BASE_URL=https://staging-backend.onrender.com k6 run load-tests/rate-limiter-stress.js
```

### CI/CD (Automated)
The GitHub Actions pipeline (`.github/workflows/ci.yml`) runs load tests automatically on `main` branch pushes with reduced VU counts appropriate for CI environments.

---

## Performance Regression Detection

A performance regression is detected when:
1. Any p95 metric exceeds 2x the baseline
2. Throughput drops below 70% of baseline
3. Error rate exceeds 1% under normal load
4. Resource utilization exceeds warning thresholds during baseline load

When a regression is detected in CI:
- Pipeline marks the step as ⚠️ WARNING (not blocking)
- k6 results are uploaded as artifacts for analysis
- Team is notified via GitHub Actions annotation
