# 24. Audit & Testing Strategy

## Document Information

| Field | Value |
|-------|-------|
| **Version** | 2.0.0 |
| **Last Updated** | June 2026 |
| **Status** | Active |
| **Owner** | QA & Security Team |

---

## 1. Test Strategy Overview

### Testing Pyramid

```
                    ┌───────────┐
                    │   E2E     │  ~50 tests (Playwright)
                    │  (Slow)   │  Full user journeys
                   ─┼───────────┼─
                  │  Performance │  ~25 scenarios (Gatling)
                  │   & Security │  Load, stress, OWASP
                 ─┼──────────────┼─
                │   Integration    │  ~350 tests (Testcontainers)
                │  (DB + Kafka +   │  Real infra, no mocks
                │   Redis + ES)    │
               ─┼──────────────────┼─
              │      Unit Tests       │  ~1,800 tests (JUnit 5 + Mockito)
              │   (Fast, Isolated,    │  Business logic, services, utils
              │    No external deps)  │
              └───────────────────────┘
```

### Test Categories Summary

| Category | Framework | Count | Execution Time | Trigger |
|----------|-----------|-------|----------------|---------|
| Unit Tests | JUnit 5 + Mockito | ~1,800 | < 2 min | Every commit |
| Integration Tests | Testcontainers | ~350 | < 8 min | Every PR |
| Contract Tests | Spring Cloud Contract | ~80 | < 3 min | Every PR |
| Architecture Tests | ArchUnit | ~30 rules | < 30s | Every commit |
| E2E Tests | Playwright | ~50 | < 15 min | Pre-release |
| Performance Tests | Gatling | ~25 scenarios | < 30 min | Weekly |
| Security Tests | OWASP ZAP + custom | ~40 checks | < 20 min | Weekly |

---

## 2. Test Infrastructure

### Testcontainers Setup

```java
@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("ai_interview_test")
        .withUsername("test")
        .withPassword("test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @Container
    static KafkaContainer kafka = new KafkaContainer(
        DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));

    @Container
    static ElasticsearchContainer elasticsearch = new ElasticsearchContainer(
        DockerImageName.parse("docker.elastic.co/elasticsearch/elasticsearch:8.13.0"))
        .withEnv("xpack.security.enabled", "false")
        .withEnv("discovery.type", "single-node");

    @Container
    static GenericContainer<?> clamav = new GenericContainer<>("clamav/clamav:1.3")
        .withExposedPorts(3310);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.elasticsearch.uris",
            () -> "http://" + elasticsearch.getHttpHostAddress());
        registry.add("app.clamav.host", clamav::getHost);
        registry.add("app.clamav.port", () -> clamav.getMappedPort(3310));
    }
}
```

### Docker Compose Test Environment

```yaml
# docker-compose.test.yml — spins up all dependencies for local integration testing
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ai_interview_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports: ["5433:5432"]

  redis:
    image: redis:7-alpine
    ports: ["6380:6379"]

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
    ports: ["9093:9092"]

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports: ["9201:9200"]

  mailpit:
    image: axllent/mailpit:latest
    ports: ["8025:8025", "1025:1025"]

  clamav:
    image: clamav/clamav:1.3
    ports: ["3311:3310"]
```

---

## 3. Running Tests

### Command Reference

```bash
# Unit tests only (fast, no containers)
./mvnw test

# Integration tests (starts Testcontainers automatically)
./mvnw verify -PintegrationTests

# All tests (unit + integration)
./mvnw verify

# Architecture tests only (ArchUnit module boundary checks)
./mvnw test -Dtest="*ArchTest*"

# Single test class
./mvnw test -Dtest="InterviewServiceTest"

# Generate API traffic for observability verification
make test-traces

# Performance test (Gatling)
./mvnw gatling:test -Pperformance

# Security scan (OWASP Dependency Check)
./mvnw org.owasp:dependency-check-maven:check

# Full CI pipeline locally
make ci-local  # runs: lint → unit → integration → arch → security
```

### Test Profiles

| Profile | Activated By | Containers | Duration |
|---------|-------------|-----------|----------|
| `test` (default) | `./mvnw test` | None | ~2 min |
| `integrationTests` | `-PintegrationTests` | PG, Redis, Kafka, ES | ~8 min |
| `performance` | `-Pperformance` | Full stack | ~30 min |
| `security` | `-Psecurity` | Full stack + ZAP | ~20 min |

---

## 4. API Testing Guide

### Registration + Email Verification

```bash
# Step 1: Register new user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@company.com",
    "password": "SecureP@ss123!",
    "firstName": "Jane",
    "lastName": "Smith",
    "organizationName": "Acme Corp"
  }'
# Response: 201 { "id": "uuid", "status": "PENDING_VERIFICATION" }

# Step 2: Verify email (token from Mailpit inbox or test stub)
curl -X POST http://localhost:8080/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{ "token": "eyJhbGciOiJSUzI1NiJ9..." }'
# Response: 200 { "message": "Email verified successfully" }
```

### Login + MFA Challenge

```bash
# Step 1: Login (returns MFA challenge if enrolled)
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "user@company.com", "password": "SecureP@ss123!" }'
# Response (MFA enabled): 200 { "mfaRequired": true, "mfaToken": "temp-token..." }

# Step 2: Submit TOTP code
curl -X POST http://localhost:8080/api/v1/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{ "mfaToken": "temp-token...", "code": "123456" }'
# Response: 200 { "accessToken": "...", "refreshToken": "...", "expiresIn": 900 }
```

### Token Refresh + Logout

```bash
# Refresh token (single-use rotation)
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..." }'
# Response: 200 { "accessToken": "new...", "refreshToken": "new...", "expiresIn": 900 }

# Logout (blacklists token in Redis)
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
# Response: 200 { "message": "Logged out successfully" }
```

### Interview CRUD

```bash
# Create
curl -X POST http://localhost:8080/api/v1/interviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Backend Engineer - System Design",
    "type": "SYSTEM_DESIGN",
    "scheduledAt": "2026-07-01T10:00:00Z",
    "duration": 60,
    "interviewers": ["uuid-1"],
    "candidateId": "uuid-2",
    "settings": { "codeEditorEnabled": true, "recordingEnabled": true }
  }'

# List (paginated + filtered)
curl "http://localhost:8080/api/v1/interviews?page=0&size=20&status=SCHEDULED&type=CODING" \
  -H "Authorization: Bearer $TOKEN"

# Update
curl -X PUT http://localhost:8080/api/v1/interviews/{id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Updated Title", "scheduledAt": "2026-07-02T14:00:00Z" }'

# Delete
curl -X DELETE http://localhost:8080/api/v1/interviews/{id} \
  -H "Authorization: Bearer $TOKEN"
# Response: 204 No Content
```

### Async Video Interview Flow

```bash
# 1. Create async interview with questions
curl -X POST http://localhost:8080/api/v1/async-interviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Backend Assessment",
    "deadline": "2026-07-15T23:59:59Z",
    "maxRetakes": 3,
    "questions": [
      { "text": "Describe distributed systems experience", "maxResponseTime": 180, "thinkingTime": 30, "order": 1 },
      { "text": "Design a chat application", "maxResponseTime": 300, "thinkingTime": 60, "order": 2 }
    ]
  }'

# 2. Publish (changes status DRAFT → PUBLISHED)
curl -X POST http://localhost:8080/api/v1/async-interviews/{id}/publish \
  -H "Authorization: Bearer $TOKEN"

# 3. Invite candidate
curl -X POST http://localhost:8080/api/v1/async-interviews/{id}/invitations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "candidateEmail": "jane@example.com", "candidateName": "Jane Smith" }'

# 4. Candidate submits video response
curl -X POST http://localhost:8080/api/v1/async-interviews/responses \
  -H "Authorization: Bearer $CANDIDATE_TOKEN" \
  -F "questionId=q-uuid" -F "invitationId=inv-uuid" \
  -F "video=@response.webm" -F "attemptNumber=1"

# 5. Reviewer submits review
curl -X POST http://localhost:8080/api/v1/async-interviews/invitations/{invId}/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "overallRating": 4, "notes": "Strong technical depth", "decision": "ADVANCE" }'
```

### Search (Elasticsearch)

```bash
# Full-text search with filters + aggregations
curl -X POST http://localhost:8080/api/v1/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "senior backend java distributed",
    "entityTypes": ["CANDIDATE", "INTERVIEW"],
    "filters": { "status": ["ACTIVE"], "dateRange": { "from": "2026-01-01", "to": "2026-12-31" } },
    "pagination": { "page": 0, "size": 20 },
    "highlight": true
  }'
# Response: { "totalHits": 47, "results": [...], "aggregations": {...} }

# Autocomplete/suggest
curl "http://localhost:8080/api/v1/search/suggest?q=jav&types=CANDIDATE" \
  -H "Authorization: Bearer $TOKEN"
```

### Report Generation

```bash
# Create template
curl -X POST http://localhost:8080/api/v1/reports/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Weekly Hiring Summary",
    "entityType": "PIPELINE",
    "format": "PDF",
    "columns": [{"field":"name","label":"Pipeline"},{"field":"total","label":"Candidates"}],
    "chartType": "FUNNEL"
  }'

# Generate on-demand
curl -X POST http://localhost:8080/api/v1/reports/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "templateId": "tmpl-uuid", "format": "PDF" }'
# Response: 202 { "reportId": "rpt-uuid", "status": "GENERATING" }

# Download
curl http://localhost:8080/api/v1/reports/{reportId}/download \
  -H "Authorization: Bearer $TOKEN" -o report.pdf
```

### Rate Limiting Verification

```bash
# Trigger rate limit on login (5 attempts/minute)
for i in {1..6}; do
  echo "Attempt $i: $(curl -s -o /dev/null -w '%{http_code}' \
    -X POST http://localhost:8080/api/v1/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@x.com","password":"wrong"}')"
done
# Expected: 401 401 401 401 401 429

# Verify rate limit headers
curl -v http://localhost:8080/api/v1/interviews -H "Authorization: Bearer $TOKEN" 2>&1 | grep -i x-ratelimit
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1719244800
```

### SSO Discovery

```bash
# By email domain
curl -X POST http://localhost:8080/api/v1/auth/sso/discover \
  -H "Content-Type: application/json" \
  -d '{ "email": "user@enterprise.com" }'
# Response: { "ssoEnabled": true, "provider": "OKTA", "discoveryMethod": "EMAIL_DOMAIN" }

# By organization slug/domain
curl "http://localhost:8080/api/v1/auth/sso/discover?domain=hire.enterprise.com"
# Uses tenant_domains table → organization → sso_configurations
```

### Pipeline Operations (Advance Candidate)

```bash
curl -X POST http://localhost:8080/api/v1/pipelines/{pipelineId}/candidates/{candidateId}/move \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "targetStageId": "stage-uuid-3", "reason": "Passed technical interview" }'
# Triggers: Kafka event → notification → analytics update → ES re-index
```

### Notification Check

```bash
curl "http://localhost:8080/api/v1/notifications?unreadOnly=true&page=0&size=10" \
  -H "Authorization: Bearer $TOKEN"
# Response: { "content": [...], "unreadCount": 5, "totalElements": 23 }
```

---

## 5. Security Audit Checklist — OWASP Top 10

| # | Vulnerability | Mitigation Implementation | Status | Test Method |
|---|---------------|--------------------------|--------|-------------|
| A01 | Broken Access Control | RBAC via @PreAuthorize + TenantContextService enforces org_id on every query | COVERED | Role-based integration tests (ADMIN, INTERVIEWER, CANDIDATE, VIEWER) |
| A02 | Cryptographic Failures | AES-256-GCM field encryption (FieldEncryptionService), RSA-256 JWT signing, TLS 1.3 in transit | COVERED | Key rotation test, certificate expiry monitoring |
| A03 | Injection | Spring Data JPA parameterized queries, XssSanitizingFilter (OWASP AntiSamy), schema name validated against `^tenant_[a-z0-9_]+$` | COVERED | SQLi/XSS test suite, Elasticsearch query escaping |
| A04 | Insecure Design | Rate limiting (per-user + per-IP), circuit breakers (Resilience4j), request body 2MB limit, ClamAV file scanning | COVERED | Threat model review, ArchUnit boundary tests |
| A05 | Security Misconfiguration | Spring Security strict defaults, CORS allowlist, HSTS headers, no stack traces in production, secrets via Vault | COVERED | Config scan in CI, security headers test |
| A06 | Vulnerable Components | Dependabot weekly, Maven dependency-check plugin (CVSS threshold: 7.0 blocks build) | COVERED | Automated PR checks, Snyk integration |
| A07 | Auth Failures | Account lockout (5 failures → 15min lock), MFA/TOTP, JWT blacklist on logout, refresh token rotation (family invalidation) | COVERED | Auth integration tests, brute-force simulation |
| A08 | Data Integrity | HMAC-SHA256 webhook signatures, JWT signature verification, Flyway migration checksums, signed Docker images | COVERED | Webhook signature test, deployment verification |
| A09 | Logging Failures | OpenTelemetry traces (Jaeger), structured logging (Loki), audit trail for all mutations, PII masking in logs | COVERED | Trace correlation test, log format validation |
| A10 | SSRF | No user-controlled URL fetching except webhooks (validated against IP allowlist), redirect URL validation | COVERED | SSRF test cases, webhook URL validation |

---

## 6. Performance Test Scenarios

### Scenario 1: WebSocket Interview Load (100 concurrent)

```
Description: Simulate 100 concurrent real-time interview sessions
Actions per user:
  - Connect WebSocket → authenticate → join room
  - Send 30 code editor changes (200ms intervals)
  - Send 10 whiteboard draw events
  - Receive broadcasts from other participants
Duration: 10 minutes sustained
SLA: < 50ms message delivery P95, 0 dropped connections
```

### Scenario 2: API Throughput (500 req/s)

```
Description: Mixed CRUD operations at sustained 500 req/s
Distribution:
  - 60% GET (list + single)
  - 20% POST (creates)
  - 15% PUT (updates)
  - 5% DELETE
Duration: 15 minutes
SLA: < 250ms P95, < 0.1% error rate, < 70% CPU
```

### Scenario 3: Bulk Schedule (1000 interviews)

```
Description: Enterprise customer bulk-creates 1000 interviews via API
Actions:
  - POST /api/v1/interviews/bulk (batch of 100 x 10 requests)
  - Each triggers: calendar event + notification + ES index + Kafka event
Duration: Single burst
SLA: Complete in < 60s, all side effects processed in < 5 minutes
```

### Scenario 4: Code Execution Under Load (50 concurrent)

```
Description: 50 candidates simultaneously executing code in Docker sandboxes
Actions per user:
  - Submit code (Python/Java/JS) every 30 seconds
  - Docker container spins up, executes, returns in < 10s
  - Container cleanup after execution
Duration: 10 minutes
SLA: < 10s execution P95, < 3% timeout rate, no container leaks
```

### Scenario 5: Multi-tenant Isolation Under Load

```
Description: 50 tenants, 20 users each, verifying zero cross-tenant data leakage
Actions:
  - Each tenant creates interviews, candidates, pipelines
  - Concurrent schema switches (SET search_path)
  - Verify no data from tenant A visible to tenant B
Duration: 20 minutes
SLA: < 2ms schema switch overhead, 0 isolation violations
```

---

## 7. Observability Verification

### Jaeger — Distributed Tracing

```bash
# 1. Make a traced API call
curl -X GET http://localhost:8080/api/v1/interviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"

# 2. Open trace in Jaeger UI
open "http://localhost:16686/trace/4bf92f3577b34da6a3ce929d0e0e4736"

# 3. Verify span hierarchy:
#    HTTP GET /api/v1/interviews (server)
#    ├── SecurityFilterChain.doFilter (JWT validation)
#    ├── TenantContextFilter (schema resolution)
#    ├── InterviewRepository.findAll (PostgreSQL)
#    ├── Redis.get (cache lookup)
#    └── KafkaProducer.send (if event emitted)
```

### Loki — Log Correlation

```bash
# Query logs by traceId
curl -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={app="ai-interview"} |= "4bf92f3577b34da6a3ce929d0e0e4736"' \
  --data-urlencode 'start=2026-06-24T00:00:00Z' \
  --data-urlencode 'end=2026-06-24T23:59:59Z'

# Log format verification (structured JSON):
# {"timestamp":"...","level":"INFO","traceId":"4bf92f...","spanId":"00f067...",
#  "service":"ai-interview","class":"InterviewService","message":"..."}
```

### Prometheus — Metrics Check

```bash
# Scrape metrics endpoint
curl http://localhost:8080/actuator/prometheus | grep -E "http_server_requests|jvm_memory|hikaricp"

# Key metrics to verify after tests:
# http_server_requests_seconds_count{method="GET",uri="/api/v1/interviews",status="200"}
# http_server_requests_seconds_bucket{method="GET",uri="/api/v1/interviews",le="0.1"}
# jvm_memory_used_bytes{area="heap"}
# hikaricp_connections_active{pool="HikariPool-1"}
# kafka_consumer_records_consumed_total{topic="interview-events"}
# resilience4j_circuitbreaker_state{name="aiService"}
```

### Kafka UI — Event Verification

```bash
# Access Kafka UI dashboard
open "http://localhost:9080"

# Verify topics exist:
#   - interview-events
#   - notification-events
#   - email-dead-letter-queue
#   - search-index-events
#   - pipeline-events
#   - analytics-events

# Check consumer group lag:
#   ai-interview-group → lag should be < 100 for all partitions
```

### RedisInsight — Rate Limit Keys

```bash
# Access RedisInsight
open "http://localhost:5540"

# Check rate limit keys (pattern: rate_limit:{type}:{identifier})
# rate_limit:login:192.168.1.1  → TTL 60, value: attempt count
# rate_limit:api:user-uuid      → TTL 60, value: request count
# token_blacklist:{jti}         → TTL matches token expiry
# tenant_cache:{org_id}         → TTL 3600, value: tenant config JSON
```

### Health Check Verification

```bash
curl http://localhost:8080/actuator/health | jq .
# {
#   "status": "UP",
#   "components": {
#     "db": { "status": "UP", "details": { "database": "PostgreSQL", "validationQuery": "isValid()" } },
#     "redis": { "status": "UP", "details": { "version": "7.2.4" } },
#     "kafka": { "status": "UP", "details": { "clusterId": "..." } },
#     "elasticsearch": { "status": "UP", "details": { "cluster_name": "docker-cluster" } },
#     "mail": { "status": "UP", "details": { "location": "localhost:1025" } },
#     "diskSpace": { "status": "UP" }
#   }
# }
```

---

## 8. Alerting Rules

| Alert | Condition | Severity | Response |
|-------|-----------|----------|----------|
| High Error Rate | error_rate > 1% for 5m | CRITICAL | Page on-call, check logs |
| High P95 Latency | p95 > 1s for 5m | WARNING | Check DB connections, GC |
| DB Pool Exhausted | active_connections = max for 1m | CRITICAL | Scale pods, check leaks |
| Kafka Consumer Lag | lag > 10,000 for 5m | WARNING | Add consumers, check processing |
| JVM Heap > 90% | used/max > 0.9 for 3m | WARNING | Trigger GC, check leak |
| Pod CrashLoop | restarts > 3 in 10m | CRITICAL | Check OOM, startup errors |
| Certificate Expiry | days < 30 | WARNING | Rotate certificate |
| Failed Login Spike | failed > 50 in 1m | CRITICAL | Check for brute force |
| Cross-tenant Violation | count > 0 | CRITICAL | Immediate investigation |
| ES Cluster Health Red | status = red | CRITICAL | Check shard allocation |

---

## 9. Quality Gates

| Gate | Threshold | Enforcement |
|------|-----------|-------------|
| Unit Test Coverage | > 80% | PR merge blocked |
| Integration Test Pass | 100% | PR merge blocked |
| Critical Vulnerabilities | 0 | Build fails |
| High Vulnerabilities | < 3 | Warning only |
| Performance Regression | > 10% degradation | PR merge blocked |
| Architecture Violations (ArchUnit) | 0 | Build fails |
| Code Duplication | < 5% | Warning only |
| Cyclomatic Complexity | < 15 per method | Warning only |

---

*Last audit: June 24, 2026. Next scheduled: September 2026.*

---

## Testing New Features (v2.0.0 Additions)

### Custom Fields Engine

```bash
TOKEN=<admin-token>

# Create a custom field definition for interviews
curl -X POST http://localhost:8080/api/v1/custom-fields/definitions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldName": "Hiring Manager",
    "fieldKey": "hiring_manager",
    "fieldType": "TEXT",
    "entityType": "INTERVIEW",
    "isRequired": false,
    "description": "Assigned hiring manager"
  }'

# Create a SELECT field with options
curl -X POST http://localhost:8080/api/v1/custom-fields/definitions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldName": "Priority Level",
    "fieldKey": "priority_level",
    "fieldType": "SELECT",
    "entityType": "JOB",
    "options": ["Low", "Medium", "High", "Critical"]
  }'

# Set a custom field value on an entity
curl -X POST http://localhost:8080/api/v1/custom-fields/values \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldDefinitionId": "<def-uuid>",
    "entityId": "<interview-uuid>",
    "entityType": "INTERVIEW",
    "value": "John Smith"
  }'

# Get all custom field values for an entity
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/custom-fields/values/<entity-uuid>?entityType=INTERVIEW"
```

### Bulk Operations API

```bash
# Batch create interviews
curl -X POST http://localhost:8080/api/v1/bulk/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "INTERVIEW",
    "items": [
      {"title": "Interview 1", "type": "TECHNICAL", "candidateEmail": "a@test.com"},
      {"title": "Interview 2", "type": "HR", "candidateEmail": "b@test.com"},
      {"title": "Interview 3", "type": "SCREENING", "candidateEmail": "c@test.com"}
    ]
  }'

# Check operation status
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/bulk/operations/<operation-uuid>

# Batch delete
curl -X POST http://localhost:8080/api/v1/bulk/delete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "INTERVIEW",
    "ids": ["uuid-1", "uuid-2", "uuid-3"]
  }'
```

### ML Predictions (Advanced Analytics)

```bash
# Predict hiring success for a candidate
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/analytics/predict/<candidate-uuid>

# Response:
# {
#   "candidateId": "...",
#   "successProbability": 0.78,
#   "recommendation": "HIRE",
#   "confidence": 0.72,
#   "topFactors": ["avg_feedback_rating", "interviewer_match_score"],
#   "predictedTimeToOffer": 5
# }

# Find best interviewer match
curl -X POST http://localhost:8080/api/v1/analytics/predict/interviewer-match \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "<candidate-uuid>",
    "interviewerIds": ["<interviewer-1>", "<interviewer-2>", "<interviewer-3>"]
  }'

# Get model metrics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/analytics/model/metrics
```

### API Versioning

```bash
# Default request (v1 — will see Sunset header in response)
curl -v http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
# Response headers: Sunset: 2027-03-01, Deprecation: true, X-API-Latest-Version: 2

# Explicitly request v2
curl http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-API-Version: 2"
# Response header: X-API-Version: 2
```

### Webhook v2 (CloudEvents)

```bash
# Register a webhook endpoint (existing API)
curl -X POST http://localhost:8080/api/v1/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/your-id",
    "events": ["com.interview-platform.interview.scheduled"],
    "secret": "my-webhook-secret"
  }'

# Trigger an event (schedule interview) — webhook receives CloudEvent envelope:
# {
#   "specversion": "1.0",
#   "id": "uuid",
#   "source": "https://interview-platform.com",
#   "type": "com.interview-platform.interview.scheduled",
#   "time": "2026-06-24T10:00:00Z",
#   "data": { ...interview payload... }
# }
```

### Elasticsearch Search (CQRS)

```bash
# Search interviews (full-text)
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/search/interviews?query=system+design&size=10"

# Search candidates
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/search/candidates?query=java+developer"

# Trigger full reindex (admin)
curl -X POST http://localhost:8080/api/v1/search/reindex \
  -H "Authorization: Bearer $TOKEN"
```

### Service Mesh Verification

```bash
# Verify mTLS is active (from within a pod)
istioctl proxy-config secret <pod-name> -n interview-platform

# Check circuit breaker stats
istioctl proxy-config cluster <pod-name> -n interview-platform | grep outlier

# View traffic in Kiali dashboard
istioctl dashboard kiali
```

---

## 10. Comprehensive Test Report (Phase 1-20)

### 10.1 Test Summary

| Metric | Value |
|--------|-------|
| **Total Tests** | **504** |
| **Existing Tests (Phase 1-16)** | 455 |
| **New Tests (Phase 17-20)** | 49 |
| **AI Live Tests** | 10 (OpenRouter integration) |
| **Test Frameworks** | JUnit 5, Mockito, Spring Boot Test |
| **All Tests Passing** | Yes |

### 10.2 Test Breakdown by Module

| Module | Package | Test Count | Type |
|--------|---------|------------|------|
| EventStore | `eventsourcing` | 3 | Unit |
| WebAuthn | `webauthn` | 3 | Unit |
| Proctoring | `proctoring` | 4 | Unit + Integration |
| DLP (Data Loss Prevention) | `dlp` | 5 | Unit + Integration |
| SlackBot | `slackbot` | 8 | Unit + Integration |
| Calibration | `calibration` | 3 | Unit |
| CostPerHire | `costperhire` | 2 | Unit |
| Nurturing | `nurturing` | 3 | Unit |
| ReferenceCheck | `referencecheck` | 2 | Unit |
| MLScoring | `mlscoring` | 2 | Unit |
| InterviewIntelligence | `interviewintelligence` | 2 | Unit |
| ISO27001 | `iso27001` | 3 | Unit |
| PenTest | `pentest` | 2 | Unit |
| ResumeRanking | `resumeranking` | 1 | Unit |
| **Existing (Phase 1-16)** | *various* | **455** | Unit + Integration |
| **AI Live Tests** | *ai/* | **10** | Live Integration |

### 10.3 How to Run Each Test Category

```bash
# Run ALL tests (504)
./mvnw test

# Run all new module tests (Phase 17-20)
./mvnw test -Dtest="*EventStoreTest*,*WebAuthnTest*,*ProctoringTest*,*DlpTest*,*SlackBotTest*,*CalibrationTest*,*CostPerHireTest*,*NurturingTest*,*ReferenceCheckTest*,*MLScoringTest*,*InterviewIntelligenceTest*,*ISO27001Test*,*PenTestTest*,*ResumeRankingTest*"

# Run security module tests only
./mvnw test -Dtest="*PenTest*,*ISO27001*,*DlpTest*,*WebAuthnTest*,*ProctoringTest*"

# Run growth/intelligence module tests only
./mvnw test -Dtest="*SlackBotTest*,*CalibrationTest*,*CostPerHireTest*,*NurturingTest*,*ReferenceCheckTest*,*MLScoringTest*,*InterviewIntelligenceTest*"

# Run infrastructure tests only
./mvnw test -Dtest="*EventStoreTest*,*ResumeRankingTest*"

# Run AI live tests (requires OPENAI_API_KEY set to OpenRouter key)
OPENAI_API_KEY=sk-or-v1-xxx ./mvnw test -Dtest="*AILiveTest*"

# Run with coverage report
./mvnw test jacoco:report
# Report at: target/site/jacoco/index.html

# Run specific module
./mvnw test -Dtest="SlackBotServiceTest"
./mvnw test -Dtest="DLPScannerServiceTest"
./mvnw test -Dtest="ProctoringServiceTest"
```

### 10.4 AI Live Test Details

The platform includes 10 live integration tests that validate AI service calls against OpenRouter. These tests require a valid `OPENAI_API_KEY` environment variable.

| # | Function Tested | Service | What It Validates |
|---|-----------------|---------|-------------------|
| 1 | Interview Summary Generation | AISummarizerService | Generates structured summaries from interview transcripts |
| 2 | Job Description Generation | AIJobDescriptionService | Creates JD from title + requirements |
| 3 | Resume Ranking | ResumeRankingService | Scores and ranks candidates against JD |
| 4 | Interview Coaching Suggestions | InterviewCoachingService | Generates follow-up questions from context |
| 5 | ML Candidate Scoring | MLScoringService | Predicts candidate success probability |
| 6 | Screening Question Generation | ScreeningBotService | Creates role-specific screening questions |
| 7 | Sentiment Analysis (AI mode) | SentimentService | Detects engagement/confidence from text |
| 8 | Competitive Intelligence | CompetitiveIntelService | Analyzes market positioning |
| 9 | Real-time Translation | RealTimeTranslationService | Translates interview content between languages |
| 10 | AI Scoring (transcript) | AIScoringService | Evaluates communication/technical/problem-solving |

**Running AI live tests:**
```bash
# Set OpenRouter key
export OPENAI_API_KEY=sk-or-v1-your-key-here

# Run AI live tests only
./mvnw test -Dtest="*AILiveTest*" -Dspring.profiles.active=test

# Expected output: 10 tests, all GREEN
# Each test makes 1 API call to OpenRouter
# Total cost per run: ~$0.01 (10 calls to GPT-4o-mini)
```

**Fallback behavior:** If `OPENAI_API_KEY` is not set or invalid, AI services return mock/rule-based responses. The live tests will be skipped (marked as `@DisabledIfEnvironmentVariable`).

### 10.5 Test Execution in CI/CD

```yaml
# GitHub Actions workflow excerpt
- name: Run all tests
  run: ./mvnw verify
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    SPRING_PROFILES_ACTIVE: test

# CI runs all 504 tests including AI live tests
# Failure in any test blocks merge
```
