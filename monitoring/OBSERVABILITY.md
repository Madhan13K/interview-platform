# Observability & Monitoring Guide

Complete guide for tracing, metrics, and log monitoring for the Interview Platform.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Backend Stack (interview-platform-backend/compose.yaml)                      │
│                                                                              │
│  ┌──────────────────┐     OTLP HTTP :4318       ┌────────────────────────┐  │
│  │  app:8080        │ ─────────────────────────► │  otel-collector        │  │
│  │  (Java Agent     │                            │  :4317 (gRPC)          │  │
│  │   v2.12.0)       │                            │  :4318 (HTTP)          │  │
│  └──────────────────┘                            │  :8889 (Prom metrics)  │  │
│                                                   └──┬───────┬───────┬────┘  │
│                                                      │       │       │       │
│                          Traces (OTLP/gRPC)──────────┘       │       │       │
│                          Metrics (Prometheus scrape)──────────┘       │       │
│                          Logs (Loki push)─────────────────────────────┘       │
│                                                      │       │       │       │
│                                                      ▼       │       ▼       │
│  ┌────────────────────┐                      ┌────────────────────────────┐  │
│  │  jaeger            │                      │  loki                      │  │
│  │  :16686 (UI)       │                      │  :3100                     │  │
│  │  :4317 (OTLP)      │                      │  (Log aggregation)         │  │
│  └────────────────────┘                      └────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                                                               │
┌──────────────────────────────────────────────────────────────┼────────────────┐
│  Monitoring Stack (monitoring/docker-compose.monitoring.yml)  │                │
│                                                              ▼                │
│  ┌───────────────────┐                   ┌────────────────────────────────┐  │
│  │  prometheus       │ ◄── datasource── │  grafana                       │  │
│  │  :9091            │                   │  :3001 (admin/admin)           │  │
│  └───────────────────┘                   │                                │  │
│    scrapes:                              │  Pre-configured datasources:   │  │
│    - otel-collector :8889                │  - Prometheus (metrics)        │  │
│    - node-exporter :9100                 │  - Loki (logs)                 │  │
│                                          │  - Jaeger (traces)             │  │
│  ┌───────────────────┐                   └────────────────────────────────┘  │
│  │  node-exporter    │                                                       │
│  │  :9100            │                                                       │
│  └───────────────────┘                                                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

All services are managed from a **single `compose.yaml`** using Docker Compose profiles.
No need to manage multiple compose files.

### Commands (from `interview-platform-backend/` directory)

| Command | What starts |
|---------|-------------|
| `make up` | App + core infrastructure only (no telemetry) |
| `make up-otel` | App + OTel Collector + Jaeger + Loki |
| `make up-monitoring` | App + Prometheus + Grafana + Node Exporter |
| `make up-all` | Everything (full observability stack) |
| `make down` | Stop all services |
| `make test-traces` | Generate test API calls to populate dashboards |
| `make clean` | Stop + remove all data volumes |
| `make logs` | Tail application container logs |
| `make ps` | Show running services |

Or use Docker Compose directly:

```bash
# App only (no telemetry — agent logs warnings but works fine)
docker compose up -d

# App + tracing/logs (OTel Collector, Jaeger, Loki)
docker compose --profile observability up -d

# App + dashboards (Prometheus, Grafana)
docker compose --profile monitoring up -d

# Everything
docker compose --profile observability --profile monitoring up -d

# Stop all
docker compose --profile observability --profile monitoring down
```

### Option A: Full Docker Compose (everything in containers)

```bash
cd interview-platform-backend

# Start all infrastructure + observability + monitoring
make up-all

# Then run your app locally with OTel agent
./scripts/run-with-otel.sh

# Generate test traces
make test-traces
```

### Option B: Local Dev (`mvn spring-boot:run` with telemetry)

When running the app locally via Maven (not in Docker), the OTel Java Agent is not
automatically attached and `otel-collector:4318` won't resolve. Use the provided script:

```bash
cd interview-platform-backend

# One command — starts infra, downloads agent, runs app with OTel
./scripts/run-with-otel.sh
```

This script:
1. Starts only infrastructure containers (Postgres, Redis, Kafka, OTel Collector, Jaeger, Loki, etc.)
2. Downloads the OTel Java Agent JAR (v2.12.0) if not already present
3. Runs `mvn spring-boot:run` with the agent attached, pointing at `localhost:4318`

All telemetry (traces, metrics, logs) flows to the same dashboards.

**Or do it manually:**

```bash
# Step 1: Start infrastructure only (no app container)
docker compose up -d postgres redis kafka zookeeper localstack keycloak vault mailpit otel-collector jaeger loki

# Step 2: Start monitoring stack
cd ../monitoring
docker compose -f docker-compose.monitoring.yml up -d

# Step 3: Download the OTel Java Agent (one-time)
cd ../interview-platform-backend
curl -sL -o opentelemetry-javaagent.jar \
  https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.12.0/opentelemetry-javaagent.jar

# Step 4: Run the app with agent attached
./mvnw spring-boot:run \
  -Dspring-boot.run.jvmArguments="\
    -javaagent:opentelemetry-javaagent.jar \
    -Dotel.service.name=interview-platform-backend \
    -Dotel.exporter.otlp.endpoint=http://localhost:4318 \
    -Dotel.exporter.otlp.protocol=http/protobuf \
    -Dotel.traces.sampler=parentbased_traceidratio \
    -Dotel.traces.sampler.arg=1.0 \
    -Dotel.metrics.exporter=otlp \
    -Dotel.logs.exporter=otlp \
    -Dotel.resource.attributes=service.namespace=interview-platform,deployment.environment=dev \
    -Djava.net.preferIPv4Stack=true"
```

**For IntelliJ IDEA / VS Code:**

Add these to your run configuration VM options:
```
-javaagent:opentelemetry-javaagent.jar
-Dotel.service.name=interview-platform-backend
-Dotel.exporter.otlp.endpoint=http://localhost:4318
-Dotel.exporter.otlp.protocol=http/protobuf
-Dotel.metrics.exporter=otlp
-Dotel.logs.exporter=otlp
-Djava.net.preferIPv4Stack=true
```

**Why this works:** The Docker Compose file maps OTel Collector ports `4317` and `4318` to the
host, so `localhost:4318` from the host reaches the collector inside Docker.

### 3. Generate Test Traces

```bash
# Login and get a JWT token
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@interview.local","password":"ChangeMe123!"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

# Make API calls (each creates a distributed trace)
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/users/me
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/interviews
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/dashboard/admin
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/notifications
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/jobs

echo "Traces generated! Open dashboards to view them."
```

### 4. Open the Dashboards

| Dashboard | URL | Credentials | Purpose |
|-----------|-----|-------------|---------|
| **Jaeger** | http://localhost:16686 | — | Trace visualization |
| **Grafana** | http://localhost:3001 | admin / admin | Unified dashboards |
| **Prometheus** | http://localhost:9091 | — | Raw metric queries |
| **Loki** | http://localhost:3100 | — | Raw log queries |
| **Mailpit** | http://localhost:8025 | — | Email testing UI |

---

## Example: Tracing a Login Request Across All Dashboards

This walkthrough shows how a single `POST /api/v1/auth/login` request appears in each dashboard.

### Step 1: Make a Login Request

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@interview.local","password":"ChangeMe123!"}'
```

### Step 2: View in Jaeger (Traces)

1. Open http://localhost:16686
2. Service: `interview-platform-backend`
3. Operation: select `POST /api/v1/auth/login`
4. Click **Find Traces**
5. Click the trace to see the span waterfall:

```
POST /api/v1/auth/login (total ~50ms, 36 spans)
├── SELECT AccountLockout                    (3.9ms)  — check if account is locked
├── SELECT User                              (2.1ms)  — load user by email
├── BCrypt password verification             (15ms)   — verify password hash
├── Session.persist LoginAttempt             (1.3ms)  — audit the login attempt
├── SELECT RefreshToken                      (3.3ms)  — cleanup expired tokens
├── INSERT RefreshToken                      (1.5ms)  — create new refresh token
├── Transaction.commit                       (0.5ms)  — commit to DB
└── HTTP 200 response with JWT
```

6. Click any span to inspect:
   - **Tags:** `http.method=POST`, `http.status_code=200`, `db.statement=SELECT...`
   - **Duration:** time spent in that operation
   - **TraceID:** unique identifier (e.g., `b03b3435c5c0622def3f126eb8c80dbf`)

**Finding failed logins:**
- Filter by Tags: `http.status_code=401` or `error=true`

### Step 3: View in Grafana/Loki (Logs)

1. Open http://localhost:3001 (login: `admin` / `admin`)
2. Click **Explore** (compass icon)
3. Select datasource: **Loki**
4. Query all app logs:

```logql
{job="interview-platform/interview-platform-backend"}
```

5. Filter for login-related logs:

```logql
{job="interview-platform/interview-platform-backend"} |= "login"
```

6. Find logs for a specific trace (copy traceID from Jaeger):

```logql
{job="interview-platform/interview-platform-backend"} |= "b03b3435c5c0622def3f126eb8c80dbf"
```

7. Find authentication failures:

```logql
{job="interview-platform/interview-platform-backend"} |= "Bad credentials"
{job="interview-platform/interview-platform-backend"} |= "Authentication failed"
```

### Step 4: View in Grafana/Jaeger (Traces via Grafana)

1. In Grafana, click **Explore**
2. Select datasource: **Jaeger**
3. Service: `interview-platform-backend`
4. Operation: `POST /api/v1/auth/login`
5. Click **Run Query**

This shows the same trace data as Jaeger UI but within Grafana — useful for quickly
switching between traces, logs, and metrics without leaving the browser tab.

### Step 5: View in Prometheus (Metrics)

1. Open http://localhost:9091 (or Grafana → Explore → Prometheus)
2. Query spans exported:

```promql
# Confirm traces are flowing to Jaeger
interview_platform_otelcol_exporter_sent_spans_total

# Confirm logs are flowing to Loki
interview_platform_otelcol_exporter_sent_log_records_total
```

### Correlation Workflow (Putting It All Together)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. JAEGER — Find the login trace                                │
│     Service: interview-platform-backend                          │
│     Operation: POST /api/v1/auth/login                           │
│     → See 36 spans showing full DB/cache/auth flow               │
│     → Copy traceID: b03b3435c5c0622def3f126eb8c80dbf             │
├─────────────────────────────────────────────────────────────────┤
│  2. LOKI — Find correlated logs                                  │
│     Query: {job=~".+"} |= "b03b3435c5c0622def3f126eb8c80dbf"    │
│     → See all log lines emitted during that request              │
│     → Includes: user email, IP, auth decision, any warnings     │
├─────────────────────────────────────────────────────────────────┤
│  3. PROMETHEUS — Check metrics around the same timestamp         │
│     → Is there a latency spike?                                  │
│     → Are there many failed logins (possible brute force)?       │
│     → Is the DB connection pool saturated?                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Viewing Traces (Jaeger)

### How to Find Traces

1. Open http://localhost:16686
2. In the left panel, select **Service**: `interview-platform-backend`
3. Click **Find Traces**
4. Click any trace to see the full span waterfall

### What Each Trace Shows

Each API request generates a distributed trace containing multiple **spans**:

```
HTTP GET /api/v1/interviews (total: 45ms)
├── JwtAuthenticationFilter (2ms)
│   └── Redis GET session:token (0.5ms)
├── InterviewController.getInterviews (40ms)
│   ├── InterviewService.findAll (35ms)
│   │   ├── SELECT * FROM interviews... (12ms)
│   │   ├── SELECT * FROM users... (8ms)
│   │   └── Redis GET cache:interviews (0.3ms)
│   └── ResponseEntity serialization (3ms)
└── HTTP response 200 OK
```

### Understanding Trace Data

| Field | Description |
|-------|-------------|
| **Operation Name** | The span name (e.g., `GET /api/v1/interviews`) |
| **Duration** | Total time for that span |
| **Tags/Attributes** | Key-value metadata (HTTP status, DB statement, error info) |
| **Logs/Events** | Timestamped events within a span (e.g., exception thrown) |
| **TraceID** | Unique ID linking all spans in a request |
| **SpanID** | Unique ID for each individual operation |

### Finding Errors

1. In Jaeger, filter by **Tags**: `error=true`
2. Or filter by **HTTP Status Code**: `http.status_code=500`
3. Expand the error span to see the exception stack trace

### Trace Context in Logs

Every log line includes trace context via MDC:
```
2026-06-23 10:30:00 INFO [trace_id=abc123def456, span_id=789012] c.i.security.JwtAuthFilter : Authenticated user: admin@interview.local
```

This allows jumping from a log entry to the full trace in Jaeger.

---

## Viewing Metrics (Prometheus + Grafana)

### Prometheus Direct Queries (http://localhost:9091)

Navigate to http://localhost:9091/graph and enter PromQL queries:

#### HTTP Request Metrics
```promql
# Total requests by endpoint
interview_platform_http_server_request_duration_seconds_count

# Request rate (requests per second over 5 minutes)
rate(interview_platform_http_server_request_duration_seconds_count[5m])

# 95th percentile latency by route
histogram_quantile(0.95, rate(interview_platform_http_server_request_duration_seconds_bucket[5m]))

# Error rate (5xx responses)
rate(interview_platform_http_server_request_duration_seconds_count{http_response_status_code=~"5.."}[5m])
```

#### JVM Metrics
```promql
# Heap memory usage
interview_platform_process_runtime_jvm_memory_usage{type="heap"}

# Garbage collection pause time
rate(interview_platform_process_runtime_jvm_gc_duration_sum[5m])

# Active threads
interview_platform_process_runtime_jvm_threads_count
```

#### Database Metrics
```promql
# DB connection pool - active connections
interview_platform_db_client_connections_usage{state="used"}

# Query duration
interview_platform_db_client_connections_wait_time_bucket
```

#### Kafka Metrics
```promql
# Consumer lag
interview_platform_messaging_consumer_lag

# Messages produced
rate(interview_platform_messaging_publish_duration_seconds_count[5m])
```

#### OTel Collector Internal Metrics
```promql
# Spans exported to Jaeger
interview_platform_otelcol_exporter_sent_spans_total

# Log records exported to Loki
interview_platform_otelcol_exporter_sent_log_records_total

# Dropped telemetry (should be 0)
interview_platform_otelcol_processor_dropped_spans_total
```

### Grafana Dashboards (http://localhost:3001)

Login: `admin` / `admin`

#### Explore Mode
1. Click the **Explore** icon (compass) in the left sidebar
2. Select a datasource from the dropdown:
   - **Prometheus** — for metrics
   - **Loki** — for logs
   - **Jaeger** — for traces

#### Importing Community Dashboards
1. Go to **Dashboards** > **Import**
2. Enter the dashboard ID and click **Load**:

| Dashboard | ID | Purpose |
|-----------|-----|---------|
| JVM Micrometer | 4701 | JVM heap, GC, threads |
| Spring Boot Statistics | 12464 | HTTP metrics, error rates |
| Node Exporter Full | 1860 | Host CPU, memory, disk, network |
| Loki Dashboard | 13639 | Log volume, error patterns |

#### Available Metrics Categories

| Category | What's Measured |
|----------|----------------|
| HTTP Server | Request count, latency (p50/p95/p99), error rate by endpoint |
| JVM | Heap/non-heap memory, GC pauses, thread count, class loading |
| Database | Connection pool (active, idle, pending), query duration |
| Kafka | Consumer lag, producer throughput, record processing time |
| Redis | Command latency, connection pool, cache hit/miss |
| System | CPU, memory, disk I/O, network (via Node Exporter) |
| OTel Collector | Spans/metrics/logs received, processed, exported, dropped |

---

## Viewing Logs (Loki via Grafana)

### Accessing Logs

1. Open Grafana: http://localhost:3001
2. Click **Explore** (compass icon)
3. Select datasource: **Loki**

### LogQL Queries

#### Basic Queries
```logql
# All application logs
{job="interview-platform/interview-platform-backend"}

# Filter by log level
{job="interview-platform/interview-platform-backend"} | level="ERROR"
{job="interview-platform/interview-platform-backend"} | level="WARN"

# Search for specific text
{job="interview-platform/interview-platform-backend"} |= "Authentication failed"
{job="interview-platform/interview-platform-backend"} |= "SQLException"
```

#### Trace-Correlated Log Queries
```logql
# Find logs for a specific trace (copy traceId from Jaeger)
{job="interview-platform/interview-platform-backend"} |= "trace_id=abc123def456"

# Find all error logs with trace context
{job="interview-platform/interview-platform-backend"} |= "ERROR" | json | trace_id != ""
```

#### Pattern-Based Queries
```logql
# Count errors per minute
count_over_time({job="interview-platform/interview-platform-backend"} |= "ERROR" [1m])

# Find slow database queries logged by Hibernate
{job="interview-platform/interview-platform-backend"} |= "slow query"

# Find authentication failures
{job="interview-platform/interview-platform-backend"} |= "Bad credentials"
```

### Log Labels Available

| Label | Example Values | Description |
|-------|---------------|-------------|
| `job` | `interview-platform/interview-platform-backend` | Service identifier |
| `level` | `INFO`, `WARN`, `ERROR`, `DEBUG` | Log severity |
| `exporter` | `OTLP` | How logs were ingested |
| `instance` | `<uuid>` | Service instance ID |

---

## Correlating Traces, Metrics, and Logs

The power of the observability stack is correlating all three signals for debugging.

### Workflow: Debugging a Slow Request

```
Step 1: METRICS (Grafana/Prometheus)
   └─► Notice a latency spike on /api/v1/interviews (p95 > 500ms)

Step 2: TRACES (Jaeger)
   └─► Filter traces by operation="GET /api/v1/interviews", minDuration=500ms
   └─► Find the slow trace, examine spans
   └─► See a DB query span taking 450ms
   └─► Copy the traceId: "abc123def456"

Step 3: LOGS (Grafana/Loki)
   └─► Query: {job="interview-platform/interview-platform-backend"} |= "abc123def456"
   └─► See the full context: which user, what parameters, any warnings

Step 4: FIX
   └─► Add a database index or optimize the query
```

### Workflow: Debugging a 500 Error

```
Step 1: TRACES (Jaeger)
   └─► Filter: service=interview-platform-backend, tags=error:true
   └─► Open the error trace
   └─► See the exception: "IllegalArgumentException: No enum constant..."
   └─► Note: traceId=def789, timestamp=2026-06-23T10:30:00Z

Step 2: LOGS (Grafana/Loki)
   └─► Query: {job="interview-platform/interview-platform-backend"} |= "def789"
   └─► See full stack trace and preceding log context
   └─► Identify: user was submitting a form with an invalid interview type

Step 3: METRICS (Prometheus)
   └─► Query: rate(http_server_requests_seconds_count{status="500"}[5m])
   └─► Confirm: error started at 10:25 after a deployment
```

### Workflow: Investigating High Memory Usage

```
Step 1: METRICS (Prometheus/Grafana)
   └─► Alert: JVM heap > 80%
   └─► Query: process_runtime_jvm_memory_usage{type="heap"}
   └─► Observe: memory climbing steadily over 2 hours

Step 2: METRICS (Prometheus)
   └─► Query: rate(process_runtime_jvm_gc_duration_sum[5m])
   └─► GC pauses increasing = possible memory leak

Step 3: TRACES (Jaeger)
   └─► Look for long-running traces or traces with many spans
   └─► Check if bulk operations are holding references

Step 4: LOGS (Loki)
   └─► Query: {job=~".+"} |= "OutOfMemoryError"
   └─► Check for heap dump messages
```

---

## Telemetry Pipeline Configuration

### OTel Collector Pipelines

| Pipeline | Receivers | Processors | Exporters |
|----------|-----------|-----------|-----------|
| **Traces** | OTLP (gRPC + HTTP) | memory_limiter, batch | Jaeger, debug |
| **Metrics** | OTLP (gRPC + HTTP) | memory_limiter, batch | Prometheus, debug |
| **Logs** | OTLP (gRPC + HTTP) | memory_limiter, batch | Loki, debug |

### What Gets Auto-Instrumented

The OpenTelemetry Java Agent (v2.12.0) automatically instruments:

| Library | Telemetry Generated |
|---------|--------------------|
| Spring MVC | HTTP server spans (method, path, status, duration) |
| RestTemplate / WebClient | HTTP client spans with context propagation |
| JDBC / Hibernate / JPA | Database query spans (sanitized SQL) |
| Apache Kafka | Producer/consumer spans (topic, partition, offset) |
| Redis (Lettuce) | Cache operation spans (command, key) |
| AWS SDK (S3) | Cloud operation spans (bucket, key) |
| Spring Security | Authentication event spans |
| `@Scheduled` | Scheduled task spans |
| `@Async` | Async operation spans with context propagation |
| Logback | Log records exported via OTLP with trace correlation |

### Environment Variables (on the app container)

| Variable | Value | Purpose |
|----------|-------|---------|
| `OTEL_SERVICE_NAME` | `interview-platform-backend` | Service name in all telemetry |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://otel-collector:4318` | Where to send telemetry |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `http/protobuf` | Wire format |
| `OTEL_TRACES_SAMPLER` | `parentbased_traceidratio` | Sampling strategy |
| `OTEL_TRACES_SAMPLER_ARG` | `1.0` | 100% sampling in dev |
| `OTEL_METRICS_EXPORTER` | `otlp` | Export metrics via OTLP |
| `OTEL_LOGS_EXPORTER` | `otlp` | Export logs via OTLP |
| `OTEL_RESOURCE_ATTRIBUTES` | `service.namespace=interview-platform,deployment.environment=dev` | Resource metadata |

---

## Stopping the Stack

```bash
cd interview-platform-backend

# Stop all services (preserves data volumes)
make down

# Or with docker compose directly
docker compose --profile observability --profile monitoring down

# Full cleanup — removes all data (Postgres, Redis, Grafana dashboards, Loki logs, etc.)
make clean
```

---

## Disabling Telemetry (Local Dev without Collector)

If running the app outside Docker Compose (e.g., via IDE) without a collector:

```bash
# Option 1: Disable the entire OTel SDK
export OTEL_SDK_DISABLED=true

# Option 2: Disable individual signal exporters
export OTEL_TRACES_EXPORTER=none
export OTEL_METRICS_EXPORTER=none
export OTEL_LOGS_EXPORTER=none

# Option 3: JVM property
java -Dotel.sdk.disabled=true -jar app.jar
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Failed to connect to localhost:4318` | App is running outside Docker without a collector. Start collector: `docker compose up -d otel-collector` |
| Jaeger shows no traces | Check OTel Collector logs: `docker compose logs otel-collector` |
| Loki shows no logs | Wait 10-15 seconds for batch flush, then query again |
| Prometheus target "down" | Verify port is accessible: `curl http://localhost:8889/metrics` |
| Grafana datasource error | Check the datasource URL uses `host.docker.internal` for cross-network access |
| IPv6 connection error | Add `-Djava.net.preferIPv4Stack=true` to JVM args |
| Mail health check failure | Ensure mailpit container is running: `docker compose ps mailpit` |

---

## Port Reference

| Port | Service | Protocol |
|------|---------|----------|
| 3001 | Grafana | HTTP (UI) |
| 3100 | Loki | HTTP (API) |
| 4317 | OTel Collector | gRPC (OTLP) |
| 4318 | OTel Collector | HTTP (OTLP) |
| 8025 | Mailpit | HTTP (UI) |
| 8080 | Application | HTTP (API) |
| 8889 | OTel Collector | HTTP (Prometheus metrics) |
| 9091 | Prometheus | HTTP (UI + API) |
| 9100 | Node Exporter | HTTP (metrics) |
| 13133 | OTel Collector | HTTP (health check) |
| 16686 | Jaeger | HTTP (UI + API) |

---

## Kafka Events & Notification Flow

### Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│  User Action (schedule/cancel/reschedule interview, submit feedback)        │
└────────────────────────┬───────────────────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  InterviewServiceImpl                                                       │
│  publishEvent(new InterviewScheduledEvent(...))                             │
└────────────────────────┬───────────────────────────────────────────────────┘
                         │ Spring ApplicationEvent
                         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  InterviewEventListener (@Async @EventListener)                             │
│                                                                            │
│  ┌──────────────────────────────┐    ┌──────────────────────────────────┐ │
│  │ NotificationProducer         │    │ InAppNotificationService          │ │
│  │ .sendNotification()          │    │ .notify()                         │ │
│  │                              │    │                                    │ │
│  │ Publishes to Kafka           │    │ 1. Save to PostgreSQL             │ │
│  │ topic: notification-events   │    │ 2. Push via WebSocket             │ │
│  └──────────────┬───────────────┘    │    /user/{email}/queue/notifs     │ │
│                 │                     └──────────────────────────────────┘ │
└─────────────────┼─────────────────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  Apache Kafka                                                               │
│                                                                            │
│  Topic: notification-events (3 partitions)                                 │
│  Topic: interview-events (3 partitions)                                    │
│  Consumer Group: notification-service                                      │
└────────────────┬───────────────────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────────────────┐
│  NotificationConsumer (@KafkaListener)                                      │
│                                                                            │
│  Channels:                                                                 │
│  ├── EMAIL → EmailNotificationService.sendEmail() → Mailpit (dev)         │
│  └── SMS   → SmsNotificationService.sendSms() → Twilio (prod) / log (dev)│
└────────────────────────────────────────────────────────────────────────────┘
```

### Kafka Topics

| Topic | Partitions | Purpose | Message Key |
|-------|-----------|---------|-------------|
| `notification-events` | 3 | Carries email/SMS notifications | Recipient email |
| `interview-events` | 3 | Interview lifecycle events (analytics) | Interview ID |
| `notification-bus` | 3 | Unified notification routing (email/SMS/push/in-app) | Recipient email |
| `search-index-events` | 3 | Triggers ES indexing (CQRS write path) | Entity type |

### Events Published

| Event Type | Topic | Trigger | Channels |
|-----------|-------|---------|----------|
| `INTERVIEW_SCHEDULED` | notification-events | Interview created | EMAIL, SMS |
| `INTERVIEW_ASSIGNED` | notification-events | Interviewer assigned | EMAIL |
| `INTERVIEW_RESCHEDULED` | notification-events | Time changed | EMAIL, SMS |
| `INTERVIEW_CANCELLED` | notification-events | Interview cancelled | EMAIL, SMS |
| `FEEDBACK_SUBMITTED` | interview-events | Feedback saved | — |

### Kafka Message Structure

```json
{
  "eventType": "INTERVIEW_SCHEDULED",
  "channels": ["EMAIL", "SMS"],
  "recipientEmail": "candidate@example.com",
  "recipientPhone": "+1234567890",
  "recipientName": "John Doe",
  "subject": "Interview Scheduled",
  "body": "Your interview has been scheduled for...",
  "metadata": {
    "interviewId": "uuid",
    "interviewerName": "Jane Smith",
    "scheduledTime": "2026-06-25T10:00:00Z"
  },
  "timestamp": "2026-06-23T10:30:00Z"
}
```

### Observing Kafka Events in Dashboards

**In Jaeger (Traces):**
1. Open http://localhost:16686
2. Service: `interview-platform-backend`
3. Filter operations containing `notification-events` or `interview-events`
4. You'll see spans like:
   ```
   notification-events publish    (1.2ms)  — producer sends message
   notification-events process    (5.3ms)  — consumer processes message
   └── EmailNotificationService   (3.1ms)  — sends the email
   ```

**In Grafana/Loki (Logs):**
```logql
# All Kafka-related logs
{job="interview-platform/interview-platform-backend"} |= "kafka"

# Notification events published
{job="interview-platform/interview-platform-backend"} |= "notification-events"

# Notification consumption
{job="interview-platform/interview-platform-backend"} |= "Consumed notification"

# Email delivery
{job="interview-platform/interview-platform-backend"} |= "sendEmail"
```

**In Prometheus (Metrics):**
```promql
# Kafka consumer lag (messages waiting to be processed)
interview_platform_messaging_consumer_lag

# Kafka message processing rate
rate(interview_platform_messaging_process_duration_seconds_count[5m])

# Messages produced per topic
rate(interview_platform_messaging_publish_duration_seconds_count[5m])
```

### In-App Notifications

**REST API Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/v1/notifications` | GET | Paginated list of user notifications |
| `GET /api/v1/notifications/unread` | GET | Unread notifications only |
| `GET /api/v1/notifications/count` | GET | Unread count (for badge) |
| `PATCH /api/v1/notifications/{id}/read` | PATCH | Mark one as read |
| `PATCH /api/v1/notifications/read-all` | PATCH | Mark all as read |

**Real-Time Push (WebSocket):**
- STOMP endpoint: `/ws` (with SockJS fallback)
- User notification queue: `/user/{email}/queue/notifications`
- Notifications pushed immediately when created (no polling needed)

**Tracing notification delivery:**
```bash
# Check emails received in Mailpit
open http://localhost:8025

# Check in-app notifications via API
TOKEN=<your-token>
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/notifications | python3 -m json.tool
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/notifications/count
```

---

## Redis Rate Limiting

### How It Works

```
┌──────────────┐     ┌─────────────────────────┐     ┌───────────────┐
│  HTTP Request │────►│  RateLimitingFilter      │────►│  Redis        │
│              │     │  (before auth filters)   │     │               │
└──────────────┘     │                          │     │  Key: ratelimit:ip:1.2.3.4:login
                     │  1. Determine limit      │     │  Value: 3 (counter)
                     │  2. Build Redis key      │     │  TTL: 60s
                     │  3. INCR + EXPIRE        │     │               │
                     │  4. Compare count ≤ max  │     └───────────────┘
                     │                          │
                     │  If allowed:             │
                     │    → pass to next filter │
                     │    → add X-RateLimit-*   │
                     │                          │
                     │  If exceeded:            │
                     │    → 429 Too Many Reqs   │
                     │    → short-circuit       │
                     └─────────────────────────┘
```

### Rate Limits by Endpoint

| Endpoint | Limit | Window | Key Pattern |
|----------|-------|--------|-------------|
| `POST /api/v1/auth/login` | 5 req | 1 min | `ratelimit:ip:{ip}:login` |
| `POST /api/v1/auth/register` | 10 req | 1 min | `ratelimit:ip:{ip}:register` |
| `POST /api/v1/auth/forgot-password` | 3 req | 1 min | `ratelimit:ip:{ip}:forgot-password` |
| Other `/api/v1/auth/**` | 10 req | 1 min | `ratelimit:ip:{ip}:{endpoint}` |
| Any endpoint (authenticated) | 60 req | 1 min | `ratelimit:user:{username}:general` |
| Any endpoint (anonymous) | 30 req | 1 min | `ratelimit:ip:{ip}:general` |

### Redis Key Strategy

```
ratelimit:{identity_type}:{identity}:{endpoint_category}

Examples:
  ratelimit:ip:192.168.1.1:login          → login attempts from this IP
  ratelimit:ip:10.0.0.5:register          → registration attempts from this IP
  ratelimit:user:admin@interview.local:general  → general API usage for this user
```

### Response When Rate Limited

**HTTP 429 Too Many Requests:**
```json
{
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again later."
}
```

**Headers on every successful request:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 57
```

### Testing Rate Limiting

```bash
# Test login rate limit (5 per minute)
for i in {1..7}; do
  echo -n "Attempt $i: "
  curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@interview.local","password":"wrong"}'
  echo ""
done
# Expected: first 5 return 401, 6th and 7th return 429
```

### Observing Rate Limiting in Dashboards

**In Jaeger (Traces):**
- Rate-limited requests still generate a trace (the filter runs before auth)
- Look for traces with very short duration and `http.status_code=429`

**In Grafana/Loki (Logs):**
```logql
# Rate limit exceeded events
{job="interview-platform/interview-platform-backend"} |= "Rate limit exceeded"

# Rate limiter key activity
{job="interview-platform/interview-platform-backend"} |= "ratelimit"
```

**In Prometheus (Metrics):**
```promql
# Count of 429 responses
interview_platform_http_server_request_duration_seconds_count{http_response_status_code="429"}

# Rate of rate-limited requests over time
rate(interview_platform_http_server_request_duration_seconds_count{http_response_status_code="429"}[5m])
```

**In Redis directly (debugging):**
```bash
# Connect to Redis CLI
docker compose exec redis redis-cli

# View all rate limit keys
KEYS ratelimit:*

# Check a specific counter
GET ratelimit:ip:172.18.0.1:login

# Check TTL remaining
TTL ratelimit:ip:172.18.0.1:login

# Manually reset a rate limit
DEL ratelimit:ip:172.18.0.1:login
```

### Fallback Behavior

If Redis is unavailable, the rate limiter falls back to an **in-memory ConcurrentHashMap**:
- Same logic (counter + time window)
- Entries auto-cleaned every 60 seconds
- Map cleared entirely if it exceeds 100,000 entries (DoS protection)
- Logged as WARN: `"Redis unavailable, using in-memory rate limiting"`

---

## Step-by-Step Testing Guide

### All Dashboard URLs

| Dashboard | URL | Credentials | Purpose |
|-----------|-----|-------------|---------|
| **Application** | http://localhost:8080 | — | Backend API + Swagger |
| **Kafka UI** | http://localhost:8086 | — | Kafka topics, messages, consumer groups |
| **RedisInsight** | http://localhost:5540 | — | Redis keys, rate limit counters, TTLs |
| **Jaeger** | http://localhost:16686 | — | Distributed traces |
| **Grafana** | http://localhost:3001 | admin / admin | Metrics + Logs + Traces |
| **Prometheus** | http://localhost:9091 | — | Raw PromQL queries |
| **Mailpit** | http://localhost:8025 | — | Emails sent by the app |

### Start Everything

```bash
cd interview-platform-backend

# Start all infrastructure + observability + monitoring (includes Kafka UI, RedisInsight)
make up-all

# Then run your app (pick one):
./scripts/run-with-otel.sh                    # local with OTel agent
# OR
docker compose --profile app up -d --build    # containerized
```

---

### Test 1: Setup RedisInsight (one-time)

1. Open http://localhost:5540
2. Click **"Add Redis Database"**
3. Enter:
   - **Host:** `host.docker.internal` (if app runs locally) or `redis` (if app runs in Docker)
   - **Port:** `6379`
   - **Database Alias:** `interview-platform`
4. Click **Add Database**
5. Click into the database → **Browser** tab to see keys

---

### Test 2: Open Kafka UI

1. Open http://localhost:8086
2. You'll see cluster: **interview-platform**
3. Click **Topics** in the left sidebar
4. You should see:
   - `notification-events` (3 partitions)
   - `interview-events` (3 partitions)
5. Click a topic → **Messages** tab to watch messages in real-time

---

### Test 3: Rate Limiting (watch in Redis)

**Run this in terminal:**
```bash
# Hit login 7 times to trigger rate limit (limit is 5/min)
for i in {1..7}; do
  echo -n "Attempt $i: "
  curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8080/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"ratelimit-test@test.com","password":"wrong"}'
  echo ""
done
```

**Expected output:**
```
Attempt 1: 401
Attempt 2: 401
Attempt 3: 401
Attempt 4: 401
Attempt 5: 401
Attempt 6: 429    ← Rate limited!
Attempt 7: 429    ← Rate limited!
```

**See in RedisInsight (http://localhost:5540):**
1. Go to your database → **Browser** tab
2. Click the filter/search icon, search for `ratelimit:*`
3. You'll see keys like:
   - `ratelimit:ip:172.18.0.1:login` → value: `7`
   - TTL: counting down from 60 seconds
4. Click a key to see its value and remaining TTL

**See in Redis CLI:**
```bash
docker compose exec redis redis-cli KEYS "ratelimit:*"
docker compose exec redis redis-cli GET "ratelimit:ip:172.18.0.1:login"
docker compose exec redis redis-cli TTL "ratelimit:ip:172.18.0.1:login"
```

**See in Jaeger (http://localhost:16686):**
- Filter: Service=`interview-platform-backend`, Tags=`http.status_code=429`
- You'll see short traces with no DB spans (request was rejected before auth)

**See in Grafana/Loki:**
```logql
{job="interview-platform/interview-platform-backend"} |= "Rate limit exceeded"
```

---

### Test 4: Kafka Events (Schedule an Interview)

**Run this in terminal:**
```bash
# Login first
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@interview.local","password":"ChangeMe123!"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

echo "Token: ${TOKEN:0:20}..."

# Schedule an interview → triggers INTERVIEW_SCHEDULED event → Kafka
curl -s -X POST http://localhost:8080/api/v1/interviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Design - Test Candidate",
    "description": "Testing Kafka event flow",
    "type": "SYSTEM_DESIGN",
    "mode": "VIDEO",
    "candidateEmail": "charlie.brown@test.com",
    "startTime": "2026-06-25T10:00:00Z",
    "endTime": "2026-06-25T11:00:00Z",
    "timeZone": "America/New_York"
  }' | python3 -m json.tool
```

**See in Kafka UI (http://localhost:8086):**
1. Go to **Topics** → `notification-events`
2. Click **Messages** tab
3. You should see a new message with:
   ```json
   {
     "eventType": "INTERVIEW_SCHEDULED",
     "channels": ["EMAIL", "SMS"],
     "recipientEmail": "charlie.brown@test.com",
     "subject": "Interview Scheduled",
     ...
   }
   ```
4. Also check **Topics** → `interview-events` for the lifecycle event
5. Click **Consumers** in the left sidebar to see consumer group `notification-service` and its lag

**See in Mailpit (http://localhost:8025):**
- You should see a scheduling email sent to `charlie.brown@test.com`

**See in Jaeger (http://localhost:16686):**
- Find the trace for `POST /api/v1/interviews`
- Look for child spans:
  - `notification-events publish` — producer sending to Kafka
  - `notification-events process` — consumer processing the message
  - `EmailNotificationService` — email being sent

**See in Grafana/Loki:**
```logql
# Kafka producer logs
{job="interview-platform/interview-platform-backend"} |= "notification-events"

# Email delivery
{job="interview-platform/interview-platform-backend"} |= "sendEmail"

# Consumer processing
{job="interview-platform/interview-platform-backend"} |= "Consumed notification"
```

---

### Test 5: In-App Notifications

**Run this in terminal:**
```bash
# Get notifications for the logged-in user
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/notifications | python3 -m json.tool

# Get unread count (badge number)
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/notifications/count

# Get only unread notifications
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/notifications/unread | python3 -m json.tool

# Mark all as read
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/notifications/read-all
```

**See in Jaeger:**
- The notification fetch traces show DB SELECT spans
- The mark-as-read traces show DB UPDATE spans

---

### Test 6: View Traces in Jaeger

1. Open http://localhost:16686
2. Service: `interview-platform-backend`
3. Try these operation filters:
   - `POST /api/v1/auth/login` — login flow (auth, DB, token creation)
   - `POST /api/v1/interviews` — interview creation + Kafka publish
   - `GET /api/v1/notifications` — notification fetch
   - `notification-events publish` — Kafka producer
   - `notification-events process` — Kafka consumer

4. Click any trace to see the span waterfall
5. Use **Tags** filter: `error=true` to find failed requests

---

### Test 7: View Logs in Grafana

1. Open http://localhost:3001 (admin/admin)
2. Click **Explore** (compass icon) → datasource: **Loki**
3. Try these queries:

```logql
# All application logs
{job="interview-platform/interview-platform-backend"}

# Only errors
{job="interview-platform/interview-platform-backend"} |= "ERROR"

# Kafka events
{job="interview-platform/interview-platform-backend"} |= "kafka"

# Rate limiting events
{job="interview-platform/interview-platform-backend"} |= "Rate limit"

# Login activity
{job="interview-platform/interview-platform-backend"} |= "login"

# Email delivery
{job="interview-platform/interview-platform-backend"} |= "sendEmail"

# Specific trace (paste traceID from Jaeger)
{job="interview-platform/interview-platform-backend"} |= "<paste-traceID-here>"
```

---

### Test 8: View Metrics in Prometheus

1. Open http://localhost:9091
2. Try these queries:

```promql
# Spans exported to Jaeger
interview_platform_otelcol_exporter_sent_spans_total

# Logs exported to Loki
interview_platform_otelcol_exporter_sent_log_records_total

# HTTP 429 (rate-limited) responses
interview_platform_http_server_request_duration_seconds_count{http_response_status_code="429"}
```

---

### Test 9: Full End-to-End Correlation

This test demonstrates the complete flow across all dashboards:

```bash
# 1. Schedule an interview (generates: trace + Kafka event + notification + email)
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@interview.local","password":"ChangeMe123!"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

curl -s -X POST http://localhost:8080/api/v1/interviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "E2E Test Interview",
    "description": "Full observability test",
    "type": "TECHNICAL",
    "mode": "VIDEO",
    "candidateEmail": "eve.davis@test.com",
    "startTime": "2026-06-26T14:00:00Z",
    "endTime": "2026-06-26T15:00:00Z",
    "timeZone": "UTC"
  }'

echo "Now check all dashboards:"
echo "  1. Jaeger  → find POST /api/v1/interviews trace, copy traceID"
echo "  2. Kafka UI → Topics → notification-events → Messages"
echo "  3. Mailpit  → email to eve.davis@test.com"
echo "  4. Loki    → paste traceID to see correlated logs"
echo "  5. Redis   → see any rate-limit keys"
```

**Verification checklist:**

| Dashboard | What to look for |
|-----------|-----------------|
| **Jaeger** | Trace with spans: HTTP handler → DB insert → Kafka publish |
| **Kafka UI** | Message in `notification-events` with `INTERVIEW_SCHEDULED` |
| **Mailpit** | Email to `eve.davis@test.com` with subject "Interview Scheduled" |
| **Grafana/Loki** | Logs correlated with the traceID from Jaeger |
| **RedisInsight** | Rate limit keys if you've been making many requests |
| **Prometheus** | Incrementing `otelcol_exporter_sent_spans_total` counter |

---

### Cleanup After Testing

```bash
# Reset rate limits in Redis
docker compose exec redis redis-cli FLUSHDB

# Stop everything
make down

# Full reset (delete all data)
make clean
```
