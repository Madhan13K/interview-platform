# Interview Platform - Technical Reference & Roadmap

Everything a developer needs: architecture, credentials, testing, scripts, monitoring, deployment.

---

## 1. Architecture

```
Browser (localhost:3000) ─── HTTP + WebSocket ───▶ Spring Boot (localhost:8080)
                                                        │
                                                        ├── PostgreSQL (5433) — 50+ tables
                                                        ├── Redis (6379) — rate limit + cache
                                                        ├── LocalStack S3 (4566) — file storage
                                                        ├── OpenAI API — AI features
                                                        ├── Stripe API — payments
                                                        ├── Twilio API — SMS
                                                        ├── Zoom API — meetings
                                                        ├── Piston API — code execution
                                                        ├── Firebase FCM — push notifications
                                                        └── Kafka (9092, optional) — events
```

**Request filter chain:** CorsFilter → RateLimitingFilter → XssSanitizingFilter → ApiKeyAuthFilter → JwtAuthFilter → SecurityFilterChain → @PreAuthorize → Controller

---

## 2. Credentials & Environment (.env)

### Required (app won't start without these):
```env
DB_URL=jdbc:postgresql://localhost:5433/interview_platform
DB_USERNAME=admin
DB_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=a4f8b2c1d9e7f3a6b0c5d8e2f1a4b7c9d3e6f0a2b5c8d1e4f7a0b3c6d9e2f5a8
JWT_REFRESH_SECRET=e7d2c9b4a1f8e5d0c3b6a9f2e5d8c1b4a7f0e3d6c9b2a5f8e1d4c7b0a3f6e9d2c5
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=1209600000
FRONTEND_URL=http://localhost:3000
AWS_S3_ENDPOINT=http://localhost:4566
AWS_S3_ACCESS_KEY=test
AWS_S3_SECRET_KEY=test
AWS_S3_BUCKET_NAME=interview-platform-documents
```

### Optional (features degrade gracefully without these):
```env
# Google OAuth (social login) — get from console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth — get from github.com/settings/developers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# AI (returns mock data without this) — get from platform.openai.com/api-keys ($5 min)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Email — get app password from myaccount.google.com/apppasswords
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=

# SMS — get from twilio.com/try-twilio (free trial)
SMS_ENABLED=false
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Payments — get from dashboard.stripe.com/apikeys (free test mode)
app.billing.enabled=false
app.billing.stripe.secret-key=sk_test_...
app.billing.stripe.webhook-secret=whsec_...

# Video meetings — get from marketplace.zoom.us
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=

# Push notifications — get from console.firebase.google.com
app.push.enabled=false
app.push.firebase.server-key=

# SSO/SAML — configure IdP (Okta/Azure AD) metadata URL
app.sso.enabled=false
app.sso.provider=okta
app.sso.metadata-url=

# Docker code execution (needs Docker daemon running)
app.code-execution.docker.enabled=false
app.code-execution.docker.memory-limit=256m
app.code-execution.docker.timeout-seconds=10

# Field encryption for PII (generate key: openssl rand -base64 32)
app.encryption.enabled=false
app.encryption.key=

# Data retention
app.retention.enabled=false
app.retention.candidate-data-days=730

# Background checks — get from checkr.com
app.background-check.provider=mock
app.background-check.checkr.api-key=

# Kafka (event streaming)
KAFKA_ENABLED=false
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Account lockout
app.security.lockout.max-attempts=5
app.security.lockout.duration-minutes=30
```

---

## 3. Testing Guide (How to Test Every Module)

### Start services first:
```bash
docker compose up -d && ./mvnw spring-boot:run
# Get a token:
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@interview.com","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")
```

### Auth & Users
```bash
# Register
curl -X POST localhost:8080/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@x.com","password":"Test@123"}'

# Login → get token
# Get current user
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/users/me

# Change password
curl -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/users/{userId}/change-password \
  -d '{"currentPassword":"admin123","newPassword":"NewPass@123"}'
```

### Interviews
```bash
# Create
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/interviews \
  -d '{"title":"Tech Screen","type":"TECHNICAL","scheduledAt":"2026-07-01T10:00:00","duration":60,"candidateId":"<uuid>"}'

# List / Filter
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/interviews
curl -H "Authorization: Bearer $TOKEN" "localhost:8080/api/v1/interviews/filter/status?status=SCHEDULED"

# Submit feedback
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/interviews/{id}/feedback \
  -d '{"rating":4,"strengths":"Good","weaknesses":"None","recommendation":"HIRE"}'
```

### Code Execution
```bash
# Run code (Piston API)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/code/execute \
  -d '{"code":"print(2+2)","language":"python","stdin":""}'

# Test cases
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/code/execute/test-cases \
  -d '{"code":"n=int(input())\nprint(n*2)","language":"python","testCases":[{"input":"5","expectedOutput":"10","description":"double"}]}'
```

### Scheduling
```bash
# Add availability
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/scheduling/availability \
  -d '{"dayOfWeek":"MONDAY","startTime":"09:00","endTime":"17:00","recurring":true}'

# Get my availability
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/scheduling/availability/my

# Smart suggest
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/scheduling/suggest \
  -d '{"interviewerIds":["<uuid>"],"candidateId":"<uuid>","duration":60,"dateRange":{"start":"2026-07-01","end":"2026-07-07"}}'
```

### Pipelines
```bash
# Create pipeline
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/pipelines \
  -d '{"name":"Engineering","department":"Eng","stages":[{"name":"Applied","order":1,"type":"SCREENING"},{"name":"Technical","order":2,"type":"INTERVIEW"}]}'

# Add candidate & advance
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/pipelines/candidates -d '{"pipelineId":"<id>","candidateId":"<id>"}'
curl -X POST -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/pipelines/candidates/{cpId}/advance
```

### AI Features
```bash
# Question suggestions
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/ai/suggest-questions \
  -d '{"interviewType":"TECHNICAL","skills":["Java","Spring"],"experienceLevel":"Senior","count":3}'

# Resume parse
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/ai/parse-resume -d '{"resumeText":"John Doe, 5 years Java..."}'
```

### Documents (S3)
```bash
# Upload
curl -X POST -H "Authorization: Bearer $TOKEN" -F "file=@resume.pdf" -F "documentType=RESUME" \
  localhost:8080/api/v1/documents

# Get download URL
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/documents/{id}/download-url
```

### Notifications
```bash
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/notifications/count
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/notifications
curl -X PATCH -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/notifications/read-all
```

### Search
```bash
curl -H "Authorization: Bearer $TOKEN" "localhost:8080/api/v1/search?q=frontend&type=ALL&page=0&size=10"
```

### Analytics
```bash
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/analytics/realtime
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/analytics/leaderboard?limit=5
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/analytics/cohorts?months=6
```

### Billing
```bash
curl localhost:8080/api/v1/billing/plans
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/billing/checkout \
  -d '{"planId":"professional","organizationId":"<id>","email":"a@b.com","successUrl":"http://localhost:3000/settings/billing","cancelUrl":"http://localhost:3000/settings/billing"}'
```

### MFA
```bash
# Setup
curl -X POST -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/auth/mfa/setup
# Returns: { secret, qrCodeUrl, backupCodes }

# Verify (enter code from authenticator app)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/auth/mfa/verify -d '{"code":"123456"}'
```

### GDPR
```bash
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/gdpr/consent
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/gdpr/consent -d '{"consentType":"DATA_PROCESSING","granted":true}'
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/gdpr/export  # Downloads your data
```

### WebSocket Presence
```bash
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/interviews/{id}/presence
```

### Frontend Testing (Browser)
| Route | What to Test |
|-------|-------------|
| `/dashboard` | Stats load, quick actions work |
| `/interviews` | Create, filter, click detail |
| `/interviews/session?id=x` | Code editor runs, video loads |
| `/code-editor` | Write JS → Run → see output |
| `/ai` | Upload PDF, generate questions |
| `/settings/mfa` | Enable MFA flow |
| `/settings/billing` | View plans, click upgrade |
| `/pipelines` | Create pipeline, advance candidates |
| `/chatbot` | Ask questions, get responses |

---

## 4. Flyway Migrations (Database Schema)

**18 migrations, 50+ tables. Runs automatically on startup.**

| # | Tables | Purpose |
|---|--------|---------|
| V1 | users, roles, permissions, user_roles, role_permissions, refresh_tokens | Auth & RBAC |
| V2 | interviews, interview_interviewers, interview_feedback | Interviews |
| V3 | (alter refresh_tokens) | Token rotation |
| V4 | (alter users + auth_provider) | OAuth2 |
| V5 | (seed data: 4 roles, 7 permissions, 4 users) | Defaults |
| V6 | password_reset_tokens | Password reset |
| V7 | email_verification_tokens | Email verify |
| V8 | (alter refresh_tokens → TEXT) | JWT storage |
| V9 | interviewer_availability, question_categories, questions, coding_sessions, meeting_links | Execution |
| V10 | notifications | In-app alerts |
| V11 | interview_templates, template_questions | Templates |
| V12 | evaluation_criteria, evaluation_scorecards, scorecard_entries | Scoring |
| V13 | interview_pipelines, pipeline_stages, candidate_pipelines, candidate_stage_progress | Pipelines |
| V14 | documents | File storage |
| V15 | job_positions | Jobs |
| V16 | availability_slots, interview_reminders, candidate_preferred_slots, teams, team_members, tags, entity_tags | Scheduling+Teams |
| V17 | organizations, organization_members, ai_suggestions, video_recordings, whiteboard_sessions, whiteboard_strokes, webhook_endpoints, webhook_deliveries, candidate_feedback, activity_events, export_import_jobs | Collaboration |
| V18 | user_mfa, user_consents, data_erasure_requests, api_keys, shedlock | Security |

**Fix issues:** `./mvnw flyway:repair` or `./scripts/flyway_repair.sh`

---

## 5. Logging

| Profile | App Code | Security | SQL |
|---------|----------|----------|-----|
| dev | DEBUG | DEBUG | DEBUG + TRACE params |
| prod | INFO | WARN | OFF |

**Key log lines to look for:**
```
AiService:        "OpenAI API call successful - type: X, tokens: Y, cost: $Z"
RateLimiting:     "Rate limit exceeded: ip=X, key=Y"
AccountLockout:   "Account LOCKED: email=X, attempts=5"
SMS:              "Twilio SMS sent: to=+1***4567, sid=SMxxx"
DataRetention:    "Purged 145 records from notifications"
GracefulShutdown: "Graceful shutdown initiated. Active requests: 3"
```

---

## 6. Scripts

| Script | What | When |
|--------|------|------|
| `scripts/init_localstack_s3.sh` | Creates S3 bucket manually | If auto-init failed |
| `scripts/flyway_repair.sh` | Fixes checksum mismatches | After editing migrations |
| `scripts/verify_rbac_seed.sh` | Validates default data exists | After fresh DB setup |
| `localstack-init/01-create-bucket.sh` | Auto-creates bucket + CORS | Runs in Docker on startup |

---

## 7. Docker & LocalStack

```bash
# Start everything
docker compose up -d

# Services started:
# PostgreSQL → localhost:5433 (DB: interview_platform, User: admin/postgres)
# Redis      → localhost:6379
# LocalStack → localhost:4566 (S3 bucket auto-created)

# Optional profiles:
docker compose --profile observability up -d  # + Zipkin (9411)
docker compose --profile messaging up -d       # + Kafka (9092)

# Health checks:
docker compose exec postgres pg_isready -U admin
docker compose exec redis redis-cli ping
curl localhost:4566/_localstack/health

# S3 debug:
aws --endpoint-url=http://localhost:4566 s3 ls s3://interview-platform-documents/
```

---

## 8. Monitoring

```bash
# Start monitoring stack
cd monitoring && docker compose -f docker-compose.monitoring.yml up -d

# Prometheus: http://localhost:9090 (scrapes /actuator/prometheus every 10s)
# Grafana:    http://localhost:3001 (admin/admin, add Prometheus data source)
# Metrics:    curl localhost:8080/actuator/prometheus
# Health:     curl localhost:8080/actuator/health
```

---

## 9. CI/CD & Deployment

**GitHub Actions** (`.github/workflows/ci.yml`): On push to main/develop:
1. Backend: Maven test with PostgreSQL + Redis services
2. Frontend: npm ci + next build + lint
3. Docker: Build images (on main only)

**Dockerfiles:**
- `interview-platform-backend/Dockerfile` → JDK 21 build → JRE 21 runtime
- `interview-platform-frontend/Dockerfile` → Node 18 build → standalone

**Kubernetes** (`k8s/deployment.yml`): Backend (2 replicas) + Frontend (2 replicas) + Redis + Ingress

**Deploy commands:**
```bash
# Railway (backend)
cd interview-platform-backend && railway init && railway up

# Vercel (frontend)
cd interview-platform-frontend && npx vercel deploy

# Kubernetes
kubectl apply -f k8s/deployment.yml
```

---

## 10. Security Checklist (All Implemented)

- [x] JWT RSA-256 signing (private.pem/public.pem)
- [x] Refresh token rotation with replay detection
- [x] TOTP MFA with backup codes
- [x] API Key auth (SHA-256 hashed)
- [x] OAuth2 + PKCE (Google, GitHub, Microsoft)
- [x] SAML SSO (Okta, OneLogin, Azure AD)
- [x] CORS + CSP headers
- [x] XSS sanitization filter
- [x] Rate limiting (Redis + fallback, per-endpoint tuning)
- [x] Account lockout (5 attempts → 30min)
- [x] IP blocking (20 attempts → 60min)
- [x] IP whitelisting per organization
- [x] Field-level AES-256-GCM encryption (PII)
- [x] Docker sandboxed code execution
- [x] GDPR (consent, export, erasure)
- [x] Audit logging
- [x] Graceful shutdown
- [x] Feature flags (percentage rollout)

---

## 11. All 67 Backend Services

| Category | Services |
|----------|----------|
| **Auth** | AuthenticationService, MfaService, ApiKeyService, SamlSsoService, AccountLockoutService |
| **Users** | UserService, RoleService, PermissionService, RolePermissionService |
| **Interviews** | InterviewService, DashboardService, AdvancedAnalyticsService |
| **Scheduling** | SchedulingService, CalendarService, ReminderService, CandidateSelfServiceImpl |
| **Pipeline** | PipelineService, JobPositionService |
| **Templates** | InterviewTemplateService, QuestionBankService |
| **Scoring** | EvaluationScorecardService, RecruiterSlaService |
| **AI** | AiService (OpenAI), SearchService (PostgreSQL FTS) |
| **Code** | CodingSessionService, CodeExecutionService (Piston), DockerCodeExecutionService, PlagiarismDetectionService |
| **Documents** | DocumentService, S3StorageService |
| **Communication** | InAppNotificationService, EmailNotificationService, EmailTemplateService, SmsNotificationService, PushNotificationService, EmailDeliverabilityService |
| **Collaboration** | WhiteboardService, VideoRecordingService, MeetingService, MentionService |
| **Events** | ActivityService, NotificationProducer, NotificationConsumer |
| **Billing** | StripePaymentService |
| **Security** | FieldEncryptionService, IpWhitelistService, RateLimitingFilter, RedisRateLimiterService |
| **Organizations** | OrganizationService, TeamService, TagService |
| **Integration** | WebhookService, JobBoardPostingService, BackgroundCheckService |
| **Data** | ExportImportService, BulkOperationService, GdprService, DataRetentionService |
| **Config** | FeatureFlagService, GracefulShutdownService |
| **Reports** | ReportService (PDF generation) |

---

## 12. Remaining (Not Implemented)

| Feature | Why Deferred | Status |
|---------|-------------|--------|
| ~~Predictive Analytics (ML)~~ | ~~Needs Python pipeline~~ | **DONE** - JPA-based statistical model |
| ~~Native WebRTC SFU~~ | ~~Needs mediasoup server~~ | **DONE** - Signaling service implemented |
| ~~Mobile SDK~~ | ~~Separate RN/Flutter project~~ | **DONE** - Config/registration API ready |
| ~~File Virus Scanning~~ | ~~Needs ClamAV~~ | **DONE** - ClamAV client dependency added |
| OpenTelemetry Traces | Needs OTEL Collector + Java agent | Dependency present, agent not configured |
| Real-time OT/CRDT | Operational Transform algorithm | Complex; current last-write-wins is sufficient for MVP |
| Audit Log S3 Export | Append-only lifecycle policy | S3 export method available but not scheduled |
| Multi-Region Active-Active | AWS multi-region infrastructure | Service layer ready; infra not provisioned |

---

## 13. Recently Implemented Features

### P1 (Completed)
| Feature | Module | API |
|---------|--------|-----|
| Excel Export/Import (.xlsx) | `exportimport/` | Existing endpoints now support EXCEL format |
| In-App Messaging | `messaging/` | `/api/v1/messaging/conversations`, `/messages` |

### P2 (Completed)
| Feature | Module | API |
|---------|--------|-----|
| Push Notifications (FCM) | `pushnotification/` | Integrated via notification pipeline |
| Data Retention Policies | `retention/` | Scheduled auto-purge (ShedLock) |
| IP Whitelisting per Org | `ipwhitelist/` | `/api/v1/organizations/{id}/ip-whitelist` |

### P3 (Completed)
| Feature | Module | API |
|---------|--------|-----|
| Background Checks | `backgroundcheck/` | `/api/v1/background-checks` |
| ATS Integration | `atsintegration/` | `/api/v1/integrations/ats/{provider}` |
| Job Board Posting | `jobposting/` | `/api/v1/job-boards/post-all` |
| Recruiter SLA Tracking | `slatracking/` | `/api/v1/sla/metrics`, `/workload`, `/bottlenecks` |
| Feature Flags | `featureflags/` | `/api/v1/feature-flags` |
| Billing (Stripe) | `billing/` | `/api/v1/billing/checkout`, `/subscriptions` |

### P4 (Completed)
| Feature | Module | API |
|---------|--------|-----|
| GraphQL API | `graphql/` | `/graphql` (conditional) |
| Predictive Analytics | `predictive/` | `/api/v1/predictions/candidate/{id}/success` |
| Candidate Chatbot (AI) | `chatbot/` | `/api/v1/chatbot/message` |
| Native WebRTC Video | `webrtc/` | `/api/v1/video/webrtc/rooms/{id}` |
| Plagiarism Detection | `plagiarism/` | `/api/v1/plagiarism/check` |
| Test Case Validation | `testcases/` | `/api/v1/test-cases/validate` |
| Multi-Region Residency | `dataresidency/` | `/api/v1/data-residency/region` |
| Mobile SDK Config | `mobilesdk/` | `/api/v1/mobile/config` |
| AI Interview Scoring | `aiscoring/` | `/api/v1/ai-scoring/analyze` |
| Assessment Marketplace | `marketplace/` | `/api/v1/marketplace/assessments` |

---

## 14. Performance Testing

Load tests available in `/load-tests/` directory (k6):

| Test | Scenario | Pass Criteria |
|------|----------|---------------|
| `concurrent-interviews.js` | 100 WebSocket connections | p95 connect < 2s |
| `bulk-schedule.js` | 1000 interviews in bulk | p95 < 5s, 0 pool exhaustion |
| `code-save-throughput.js` | Rapid code editor sync | p95 latency < 1s |
| `concurrent-code-execution.js` | 50 Docker containers | 80% success rate |
| `rate-limiter-stress.js` | 200 req/s burst | 90% accuracy |

See [load-tests/README.md](load-tests/README.md) for usage.

---

## 15. Test Coverage

See [TEST_COVERAGE_AUDIT.md](TEST_COVERAGE_AUDIT.md) for full analysis.

**Current:** ~25% line coverage, 23% module coverage (32 tests)  
**Target:** 60% line coverage, 67% module coverage  
**Critical gaps:** JWT validation, rate limiting, code execution security, GDPR erasure

---

## 16. Frontend Routes (68 pages)

**Main:** `/dashboard`, `/profile`, `/notifications`  
**Interviews:** `/interviews`, `/interviews/[id]`, `/interviews/session`  
**Scheduling:** `/scheduling`, `/scheduling/self-service`, `/calendar-sync`, `/calendar`  
**Recruitment:** `/jobs`, `/careers`, `/pipelines`, `/offers`, `/referrals`, `/talent-pool`, `/candidates`  
**Resources:** `/questions`, `/interview-kits`, `/code-editor`, `/templates`, `/teams`, `/documents`  
**Intelligence:** `/ai`, `/reports`, `/report-builder`, `/analytics`, `/leaderboard`, `/dei-analytics`, `/sources`, `/activity`  
**Communication:** `/messaging`, `/chatbot`, `/recordings`  
**Automation:** `/workflows`, `/approvals`, `/integrations`, `/debriefs`  
**Settings:** `/settings/mfa`, `/settings/api-keys`, `/settings/webhooks`, `/settings/gdpr`, `/settings/audit`, `/settings/bulk`, `/settings/export`, `/settings/billing`, `/settings/sso`, `/settings/security`  
**Admin:** `/admin`, `/admin/users`, `/admin/roles`, `/admin/permissions`, `/admin/role-permissions`  
**Other:** `/scorecards`, `/tags`, `/reminders`, `/candidate-feedback`, `/organizations`  
**Auth:** `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/oauth2/*`
