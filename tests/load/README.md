# Performance & Load Testing Guide

## Overview

This directory contains k6 load test scripts for stress-testing critical system components.

## Prerequisites

```bash
# Install k6
brew install k6          # macOS
# or
sudo apt-get install k6  # Ubuntu
# or
docker pull grafana/k6   # Docker
```

## Test Scenarios

| Test | File | What It Tests | Target Metric |
|------|------|---------------|---------------|
| 100 Concurrent Interviews | `concurrent-interviews.js` | WebSocket connection limits, STOMP throughput | p95 connect < 2s |
| 1000 Bulk Schedule | `bulk-schedule.js` | DB connection pool exhaustion, HikariCP | p95 schedule < 5s |
| High-Frequency Code Saves | `code-save-throughput.js` | WebSocket message throughput, code sync | p95 latency < 1s |
| 50 Concurrent Executions | `concurrent-code-execution.js` | Docker container limits, resource contention | 80%+ success rate |
| Rate Limiter Stress | `rate-limiter-stress.js` | Redis INCR race conditions, 429 accuracy | 90%+ accuracy |

## Running Tests

### Quick Start (Single Test)
```bash
# Run with default settings
k6 run load-tests/concurrent-interviews.js

# Custom target
k6 run --env BASE_URL=http://your-server:8080 load-tests/bulk-schedule.js

# With auth token
k6 run --env AUTH_TOKEN=eyJhbGci... load-tests/concurrent-interviews.js
```

### Full Suite
```bash
# Run all tests sequentially
for f in load-tests/*.js; do
  echo "=== Running $f ==="
  k6 run "$f"
  sleep 10  # Cool-down between tests
done
```

### With Grafana Dashboard
```bash
# Start monitoring stack
cd monitoring && docker compose -f docker-compose.monitoring.yml up -d

# Run with InfluxDB output (for Grafana visualization)
k6 run --out influxdb=http://localhost:8086/k6 load-tests/concurrent-interviews.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:8080` | Backend API URL |
| `WS_URL` | `ws://localhost:8080/ws` | WebSocket URL |
| `AUTH_TOKEN` | (auto-login) | Pre-authenticated JWT token |

## Interpreting Results

### Pass Criteria
- **WebSocket**: p95 connect time < 2s, 95%+ connection success
- **Database**: p95 response < 5s, 0 pool exhaustion events
- **Throughput**: 95%+ message delivery rate
- **Docker**: 80%+ execution success, < 25 timeouts
- **Rate Limit**: 90%+ accuracy, < 20 race condition bypasses

### Common Failure Patterns

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| WS connect timeouts | Tomcat WebSocket thread pool full | Increase `server.tomcat.threads.max` |
| 503 on bulk schedule | HikariCP pool exhausted | Increase `spring.datasource.hikari.maximum-pool-size` |
| Code execution 408 | Docker daemon overloaded | Limit concurrent containers, add queuing |
| Rate limit bypass | Redis INCR not atomic | Use Lua script for atomic check-and-increment |
| OOM on code exec | Container memory unbounded | Enforce `--memory` flag in Docker config |

## Capacity Planning

Based on load test results, recommended settings for production:

| Component | Setting | Value |
|-----------|---------|-------|
| HikariCP | maximum-pool-size | 30-50 |
| Tomcat | server.tomcat.threads.max | 200 |
| WebSocket | maxSessionIdleTimeout | 600000 (10 min) |
| Docker | Concurrent containers | Max 20 |
| Redis | maxmemory | 256MB+ |
| JVM | -Xmx | 2G-4G |
