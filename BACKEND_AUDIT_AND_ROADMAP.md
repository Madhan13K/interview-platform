# Interview Platform - Backend Technical Reference

Pure technical reference for the backend. No roadmap, no feature status, no future plans (see ROADMAP.md for those).

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                         │
│  Browser (localhost:3000)    Mobile App    External API Consumers             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTP + WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SPRING BOOT APPLICATION (localhost:8080)                  │
│                          Java 21 / Spring Boot 4.0.6                         │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Filter Chain:                                                        │    │
│  │ CorsFilter → RateLimitingFilter → XssSanitizingFilter →             │    │
│  │ ApiKeyAuthFilter → JwtAuthFilter → SecurityFilterChain →            │    │
│  │ @PreAuthorize → Controller                                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  70+ Controllers │ 90+ Services │ 62+ Entities │ 320+ API Endpoints         │
└───────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
        │          │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼          ▼
  ┌──────────┐ ┌───────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌────────────┐
  │PostgreSQL│ │ Redis │ │ Kafka  │ │  S3   │ │WebSocket│ │  External  │
  │  :5433   │ │ :6379 │ │ :9092  │ │ :4566 │ │  STOMP  │ │   APIs     │
  │ 50+ tbls │ │cache/ │ │events/ │ │files/ │ │realtime │ │(see below) │
  │ 33 migr. │ │ratelim│ │async   │ │docs   │ │         │ │            │
  └──────────┘ └───────┘ └────────┘ └───────┘ └─────────┘ └────────────┘
```

### External Service Connections

| Service       | Purpose                  | Port/URL                    |
|---------------|--------------------------|------------------------------|
| PostgreSQL 16 | Primary database         | localhost:5433               |
| Redis 7       | Cache + rate limiting    | localhost:6379               |
| Kafka 7.6     | Event streaming          | localhost:9092 (optional)    |
| LocalStack S3 | File storage             | localhost:4566               |
| OpenAI        | AI features              | api.openai.com               |
| Stripe        | Payments                 | api.stripe.com               |
| Razorpay      | Payments (India)         | api.razorpay.com             |
| PayU          | Payments                 | sandboxsecure.payu.in        |
| Cashfree      | Payments                 | sandbox.cashfree.com         |
| PhonePe       | Payments (India)         | api-preprod.phonepe.com      |
| Twilio        | SMS/Voice                | api.twilio.com               |
| Firebase FCM  | Push notifications       | fcm.googleapis.com           |
| Zoom          | Video meetings           | api.zoom.us                  |
| DocuSign      | E-signatures             | demo.docusign.net            |
| Checkr        | Background checks        | api.checkr.com               |
| Greenhouse    | ATS integration          | harvest.greenhouse.io        |
| ClamAV        | Virus scanning           | localhost:3310               |
| Piston        | Code execution sandbox   | emkc.org/api/v2/piston       |

---

## 2. Credentials & Environment (.env)

### Required (application will not start without these)

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

### Optional (features degrade gracefully)

```env
# Google OAuth — console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# OpenAI — platform.openai.com/api-keys
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# Stripe — dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Razorpay — dashboard.razorpay.com/app/keys
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=

# PayU — payu.in/business
PAYU_MERCHANT_KEY=
PAYU_MERCHANT_SALT=
PAYU_BASE_URL=https://sandboxsecure.payu.in

# Cashfree — merchant.cashfree.com
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_BASE_URL=https://sandbox.cashfree.com

# PhonePe — developer.phonepe.com
PHONEPE_MERCHANT_ID=
PHONEPE_SALT_KEY=
PHONEPE_SALT_INDEX=1
PHONEPE_BASE_URL=https://api-preprod.phonepe.com

# Twilio — console.twilio.com
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Firebase — console.firebase.google.com
FIREBASE_CREDENTIALS_PATH=firebase-service-account.json

# Zoom — marketplace.zoom.us
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_ACCOUNT_ID=

# DocuSign — developers.docusign.com
DOCUSIGN_INTEGRATION_KEY=
DOCUSIGN_SECRET_KEY=
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_BASE_URL=https://demo.docusign.net

# Checkr — dashboard.checkr.com
CHECKR_API_KEY=
CHECKR_BASE_URL=https://api.checkr.com

# Greenhouse — app.greenhouse.io
GREENHOUSE_API_KEY=
GREENHOUSE_BASE_URL=https://harvest.greenhouse.io

# ClamAV
CLAMAV_HOST=localhost
CLAMAV_PORT=3310

# Kafka (optional event streaming)
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# SMTP (email)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
```

---

## 3. Test Accounts

| Email                | Password  | Role        |
|----------------------|-----------|-------------|
| admin@interview.com  | admin123  | ADMIN       |
| frank@test.com       | Test@123  | INTERVIEWER |
| alice@test.com       | Test@123  | CANDIDATE   |
| charlie@test.com     | Test@123  | HR_MANAGER  |

---

## 4. Testing Every Module (curl commands)

### Authenticate (get token)

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@interview.com","password":"admin123"}' | jq -r '.token')
```

### Core Modules

```bash
# Users
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/users/me
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/users?page=0&size=10

# Interviews
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/interviews
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/interviews/1

# Candidates
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/candidates

# Jobs
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/jobs
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/jobs/1

# Applications
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/applications

# Assessments
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/assessments

# Questions
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/questions

# Feedback
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/feedback

# Scheduling
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/scheduling/available-slots

# Notifications
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/notifications

# Analytics/Dashboard
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/analytics/dashboard
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/analytics/reports

# Documents
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/documents

# Payments
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/payments
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/subscriptions

# AI Features
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/ai/resume-analysis
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/ai/interview-feedback

# Communication
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/messages
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/video-calls

# Audit Log
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/audit-logs

# System Health
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/info
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/actuator/prometheus
```

### Payment Gateway Testing

```bash
# Stripe checkout session
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId":1,"gateway":"STRIPE"}' \
  http://localhost:8080/api/payments/checkout

# Razorpay order
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId":1,"gateway":"RAZORPAY"}' \
  http://localhost:8080/api/payments/checkout

# Webhook endpoints (called by gateways)
# POST /api/webhooks/stripe
# POST /api/webhooks/razorpay
# POST /api/webhooks/payu
# POST /api/webhooks/cashfree
# POST /api/webhooks/phonepe
```

---

## 5. Database Schema Overview

### Technology
- PostgreSQL 16
- Flyway migrations (33 total)
- 62+ JPA entities
- 50+ tables

### Flyway Migrations List

| Version | Description                              |
|---------|------------------------------------------|
| V1      | Initial schema (users, roles)            |
| V2      | Interview tables                         |
| V3      | Questions and assessments                |
| V4      | Candidates and applications              |
| V5      | Job postings                             |
| V6      | Scheduling and calendar                  |
| V7      | Feedback and evaluations                 |
| V8      | Documents and file metadata              |
| V9      | Notifications                            |
| V10     | Audit log                                |
| V11     | Analytics tables                         |
| V12     | Payment and subscription tables          |
| V13     | Communication/messaging                  |
| V14     | Video call sessions                      |
| V15     | AI analysis results                      |
| V16     | User preferences and settings            |
| V17     | Teams and departments                    |
| V18     | Skills and competencies                  |
| V19     | Interview panels                         |
| V20     | Offer management                         |
| V21     | Onboarding workflows                     |
| V22     | Background check records                 |
| V23     | Integration configs                      |
| V24     | Rate limiting tables                     |
| V25     | MFA/TOTP secrets                         |
| V26     | SSO/SAML configuration                   |
| V27     | API keys                                 |
| V28     | Webhook configurations                   |
| V29     | Report templates                         |
| V30     | Code execution submissions               |
| V31     | Scorecard templates                      |
| V32     | Talent pool                              |
| V33     | Compliance and data retention            |

### Key Entity Relationships

```
User (1) ──── (N) Interview
User (1) ──── (N) Application
Job (1) ──── (N) Application
Interview (1) ──── (N) Feedback
Interview (1) ──── (1) Assessment
Assessment (1) ──── (N) Question
User (1) ──── (N) Notification
User (1) ──── (1) Subscription
Subscription (1) ──── (N) Payment
```

---

## 6. Logging Configuration

### Log Levels (application.yml)

```yaml
logging:
  level:
    root: INFO
    com.interview.platform: DEBUG
    org.springframework.security: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
  file:
    name: logs/application.log
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

### Log Files

| File                      | Content                    |
|---------------------------|----------------------------|
| logs/application.log      | Main application log       |
| logs/audit.log            | Security/audit events      |
| logs/error.log            | Errors only (appender)     |

### Structured Logging (JSON)

Production profile uses JSON structured logging via Logback with MDC fields:
- `requestId` - correlation ID per request
- `userId` - authenticated user
- `sessionId` - session tracking
- `traceId` - distributed tracing

---

## 7. Scripts Available

| Script                        | Purpose                                      |
|-------------------------------|----------------------------------------------|
| `./mvnw spring-boot:run`     | Start application                            |
| `./mvnw test`                | Run all unit tests                           |
| `./mvnw verify`              | Run unit + integration tests                 |
| `./mvnw clean package -DskipTests` | Build JAR without tests                |
| `./mvnw flyway:migrate`      | Run pending migrations                       |
| `./mvnw flyway:info`         | Show migration status                        |
| `docker-compose up -d`       | Start all infrastructure                     |
| `docker-compose up -d postgres redis localstack` | Start minimal infra      |
| `docker-compose down -v`     | Tear down with volume cleanup                |
| `scripts/seed-data.sh`       | Load test/seed data                          |
| `scripts/backup-db.sh`       | Backup PostgreSQL database                   |
| `scripts/restore-db.sh`      | Restore from backup                          |

---

## 8. Docker / LocalStack Setup

### docker-compose.yml Services

```yaml
services:
  postgres:
    image: postgres:16
    ports: ["5433:5432"]
    environment:
      POSTGRES_DB: interview_platform
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  localstack:
    image: localstack/localstack:latest
    ports: ["4566:4566"]
    environment:
      SERVICES: s3
      DEFAULT_REGION: us-east-1

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    ports: ["9092:9092"]
    depends_on: [zookeeper]

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    ports: ["2181:2181"]

  prometheus:
    image: prom/prometheus:latest
    ports: ["9090:9090"]
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports: ["3001:3000"]
    volumes:
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
```

### LocalStack S3 Initialization

```bash
# Auto-runs on container start via init script
awslocal s3 mb s3://interview-platform-documents
awslocal s3api put-bucket-cors --bucket interview-platform-documents \
  --cors-configuration '{"CORSRules":[{"AllowedOrigins":["*"],"AllowedMethods":["GET","PUT","POST","DELETE"],"AllowedHeaders":["*"]}]}'
```

---

## 9. Monitoring (Prometheus / Grafana)

### Prometheus Targets

| Target                  | Endpoint                              |
|-------------------------|---------------------------------------|
| Spring Boot Actuator    | localhost:8080/actuator/prometheus     |
| PostgreSQL Exporter     | localhost:9187/metrics                 |
| Redis Exporter          | localhost:9121/metrics                 |

### Key Metrics Exposed

```
# JVM
jvm_memory_used_bytes
jvm_threads_live_threads
jvm_gc_pause_seconds

# HTTP
http_server_requests_seconds_count
http_server_requests_seconds_sum
http_server_requests_seconds_max

# Custom Business Metrics
interviews_scheduled_total
interviews_completed_total
payments_processed_total
ai_analysis_requests_total
active_users_gauge
```

### Grafana Dashboards (localhost:3001, admin/admin)

1. **Application Overview** - request rates, error rates, latency percentiles
2. **JVM Metrics** - heap, GC, threads
3. **Database** - connection pool, query times
4. **Business KPIs** - interviews/day, revenue, user signups

---

## 10. CI/CD Pipeline Stages

```
┌─────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐   ┌────────┐
│  Lint   │──▶│  Build   │──▶│   Test   │──▶│ Package │──▶│ Deploy │
│Checkstyle│  │Maven Compile│ │Unit+Integ│  │Docker img│  │  K8s   │
└─────────┘   └──────────┘   └──────────┘   └─────────┘   └────────┘
```

| Stage       | Tool              | Details                                    |
|-------------|-------------------|--------------------------------------------|
| Lint        | Checkstyle, SpotBugs | Code style + static analysis            |
| Build       | Maven 3.9+        | Compile Java 21 sources                   |
| Unit Test   | JUnit 5, Mockito  | ~200+ unit tests                          |
| Integration | Testcontainers    | PostgreSQL, Redis, LocalStack in Docker   |
| Security    | OWASP Dependency Check | CVE scanning of dependencies         |
| Package     | Docker            | Multi-stage build, distroless base image  |
| Deploy      | Kubernetes/Helm   | Rolling update, health check gates        |

---

## 11. Security Checklist (Implemented Features)

### Authentication
- [x] JWT access tokens (RSA-256 signed)
- [x] JWT refresh token rotation
- [x] OAuth2 (Google, GitHub)
- [x] SAML SSO
- [x] MFA/TOTP (Google Authenticator)
- [x] API key authentication (for integrations)
- [x] Account lockout after failed attempts

### Authorization
- [x] Role-based access control (ADMIN, HR_MANAGER, INTERVIEWER, CANDIDATE)
- [x] Method-level @PreAuthorize
- [x] Resource ownership validation
- [x] API key scoping

### Input/Output Security
- [x] XSS sanitization filter (all inputs)
- [x] SQL injection prevention (parameterized queries via JPA)
- [x] CORS configuration (allowed origins whitelist)
- [x] Content-Type validation
- [x] File upload virus scanning (ClamAV)
- [x] File type/size restrictions

### Rate Limiting
- [x] Per-IP rate limiting (Redis-backed)
- [x] Per-user rate limiting
- [x] Endpoint-specific limits (auth endpoints stricter)
- [x] Distributed rate limiting via Redis

### Data Protection
- [x] Password hashing (BCrypt)
- [x] Sensitive field encryption at rest
- [x] HTTPS enforcement (production)
- [x] Secure cookie flags (HttpOnly, Secure, SameSite)
- [x] PII data masking in logs
- [x] GDPR data export/deletion endpoints

### Infrastructure
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, CSP)
- [x] Audit logging (all state-changing operations)
- [x] Session management (concurrent session control)
- [x] CSRF protection (stateless token)
- [x] Dependency vulnerability scanning (OWASP)

---

## 12. All Backend Services (by Category)

### Authentication & Authorization (8)
1. AuthenticationService
2. JwtTokenService
3. RefreshTokenService
4. OAuth2UserService
5. MfaService
6. SamlAuthService
7. ApiKeyService
8. PasswordResetService

### User Management (6)
9. UserService
10. UserProfileService
11. RoleService
12. PermissionService
13. TeamService
14. DepartmentService

### Interview Management (10)
15. InterviewService
16. InterviewSchedulingService
17. InterviewPanelService
18. InterviewFeedbackService
19. InterviewScorecardService
20. InterviewRoomService
21. LiveCodingService
22. CodeExecutionService
23. WhiteboardService
24. InterviewRecordingService

### Job & Application Management (8)
25. JobService
26. JobPostingService
27. ApplicationService
28. ApplicationWorkflowService
29. CandidateService
30. CandidatePipelineService
31. TalentPoolService
32. RequisitionService

### Assessment & Questions (7)
33. AssessmentService
34. QuestionService
35. QuestionBankService
36. TestCaseService
37. SkillAssessmentService
38. CompetencyService
39. GradingService

### AI & Analytics (8)
40. AiResumeAnalysisService
41. AiInterviewFeedbackService
42. AiQuestionGenerationService
43. AiSentimentAnalysisService
44. AnalyticsService
45. ReportingService
46. DashboardService
47. MetricsService

### Payments & Subscriptions (9)
48. PaymentService
49. StripePaymentService
50. RazorpayPaymentService
51. PayUPaymentService
52. CashfreePaymentService
53. PhonePePaymentService
54. SubscriptionService
55. InvoiceService
56. WebhookService

### Communication (8)
57. NotificationService
58. EmailService
59. SmsService (Twilio)
60. PushNotificationService (Firebase)
61. InAppMessageService
62. ChatService
63. VideoCallService (Zoom)
64. WebSocketService

### Document Management (5)
65. DocumentService
66. FileStorageService (S3)
67. ResumeParsingService
68. TemplateService
69. DocuSignService

### Integrations (7)
70. GreenhouseIntegrationService
71. CheckrBackgroundCheckService
72. ZoomIntegrationService
73. CalendarIntegrationService
74. SlackIntegrationService
75. WebhookDeliveryService
76. ExternalApiService

### Scheduling & Calendar (5)
77. SchedulingService
78. AvailabilityService
79. CalendarSyncService
80. TimeZoneService
81. ReminderService

### Compliance & Administration (8)
82. AuditLogService
83. DataRetentionService
84. GdprService
85. ComplianceService
86. SystemConfigService
87. FeatureFlagService
88. CacheService
89. RateLimitService

### Onboarding & Offers (6)
90. OfferService
91. OfferApprovalService
92. OnboardingService
93. OnboardingTaskService
94. BackgroundCheckService
95. EmployeeTransitionService

---

## 13. Configuration Reference (application.yml)

### Server

```yaml
server:
  port: 8080
  servlet:
    context-path: /
  compression:
    enabled: true
    mime-types: application/json,text/html,text/css,application/javascript
```

### Database

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      max-lifetime: 600000
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        format_sql: true
        default_batch_fetch_size: 20
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
```

### Redis

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST}
      port: ${REDIS_PORT}
      timeout: 2000ms
      lettuce:
        pool:
          max-active: 16
          max-idle: 8
```

### Kafka

```yaml
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    consumer:
      group-id: interview-platform
      auto-offset-reset: earliest
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
```

### Security

```yaml
app:
  security:
    jwt:
      secret: ${JWT_SECRET}
      refresh-secret: ${JWT_REFRESH_SECRET}
      expiration: ${JWT_EXPIRATION:86400000}
      refresh-expiration: ${JWT_REFRESH_EXPIRATION:1209600000}
    rate-limit:
      enabled: true
      requests-per-minute: 60
      auth-requests-per-minute: 10
    cors:
      allowed-origins: ${FRONTEND_URL}
      allowed-methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
      allowed-headers: "*"
      allow-credentials: true
```

### S3 / File Storage

```yaml
app:
  storage:
    s3:
      endpoint: ${AWS_S3_ENDPOINT}
      access-key: ${AWS_S3_ACCESS_KEY}
      secret-key: ${AWS_S3_SECRET_KEY}
      bucket-name: ${AWS_S3_BUCKET_NAME}
      region: us-east-1
    max-file-size: 10MB
    allowed-types: pdf,doc,docx,png,jpg,jpeg
```

### Actuator / Monitoring

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics,loggers
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: interview-platform
```

### Profiles

| Profile      | Purpose                                          |
|--------------|--------------------------------------------------|
| `default`    | Local development (debug logging, H2 fallback)   |
| `dev`        | Development environment                          |
| `staging`    | Pre-production (production-like, test data)      |
| `production` | Production (optimized, minimal logging)          |
| `test`       | Test execution (Testcontainers, mocked externals)|

---

## Quick Start

```bash
# 1. Start infrastructure
docker-compose up -d postgres redis localstack

# 2. Copy environment
cp .env.example .env

# 3. Run application
./mvnw spring-boot:run

# 4. Verify
curl http://localhost:8080/actuator/health
# → {"status":"UP"}

# 5. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@interview.com","password":"admin123"}'
```
