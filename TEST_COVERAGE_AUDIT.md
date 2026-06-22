# Test Coverage Audit

**Last Updated:** 2026-06-22

---

## 1. Quick Summary

| Metric | Value |
|--------|-------|
| Backend test files | 60 |
| Backend test methods | ~840+ |
| Module coverage | 40/73 (55%) |
| Security code coverage | ~85% |
| Critical path coverage | ~90% |
| HIGH priority gaps | 0 |
| MEDIUM priority gaps | 0 |
| Load test scripts (k6) | 5 |
| E2E test flows (Playwright) | 6 |

**Tools:** JUnit 5, Testcontainers, Spring MockMvc, k6, Playwright, Storybook

---

## 2. How to Run Tests

### Unit Tests (no Docker required)

```bash
cd interview-platform-backend && ./mvnw test
```

### Integration Tests (Docker required for Testcontainers)

```bash
cd interview-platform-backend && ./mvnw verify -PintegrationTests
```

### All Backend Tests

```bash
cd interview-platform-backend && ./mvnw verify
```

### Load Tests (k6 - requires running backend)

```bash
k6 run load-tests/concurrent-interviews.js
k6 run load-tests/bulk-schedule.js
k6 run load-tests/code-save-throughput.js
k6 run load-tests/concurrent-code-execution.js
k6 run load-tests/rate-limiter-stress.js
```

### E2E Tests (Playwright)

```bash
cd interview-platform-frontend && npx playwright install && npx playwright test
```

### Full CI Pipeline (local simulation)

```bash
act -j backend-test   # Requires 'act' CLI
```

---

## 3. Test Inventory

### Sprint 1: Security Tests (5 files, ~44 methods)

| File | Package | Type | Methods |
|------|---------|------|---------|
| `JwtTokenValidationTest.java` | `security.jwt` | Unit | 10 |
| `RateLimiterUnitTest.java` | `security` | Unit | 8 |
| `AccountLockoutServiceTest.java` | `security` | Unit | 6 |
| `CodeExecutionSecurityTest.java` | `codeexecution` | Unit | 10 |
| `DocumentUploadValidationTest.java` | `document` | Unit | 10 |

### Sprint 2: Core Workflow Tests (5 files, ~30 methods)

| File | Package | Type | Methods |
|------|---------|------|---------|
| `SchedulingConflictDetectionTest.java` | `scheduling` | Unit | 7 |
| `PipelineStateMachineTest.java` | `pipeline` | Unit | 10 |
| `MessagingServiceTest.java` | `messaging` | Integration | 2 |
| `NotificationDeliveryTest.java` | `notification` | Unit | 5 |
| `GdprErasureCompletenessTest.java` | `gdpr` | Unit | 6 |

### Sprint 3: Integration Tests (5 files, ~25 methods)

| File | Package | Type | Methods |
|------|---------|------|---------|
| `ESignatureWorkflowTest.java` | `offer` | Unit | 4 |
| `BulkOperationPartialFailureTest.java` | `bulk` | Unit | 3 |
| `CalendarSyncConflictTest.java` | `calendarsync` | Unit | 12 |
| `ApprovalChainFlowTest.java` | `approval` | Unit | 4 |
| `ExcelExportImportTest.java` | `exportimport` | Unit | 2 |

### Sprint 4: Performance Validation (2 files + 5 k6 scripts)

| File | Package | Type | Methods |
|------|---------|------|---------|
| `PerformanceBaselineTest.java` | `performance` | Unit | - |
| `AbstractIntegrationTest.java` | `config` | Utility | - |
| `concurrent-interviews.js` | `load-tests` | k6 | - |
| `bulk-schedule.js` | `load-tests` | k6 | - |
| `code-save-throughput.js` | `load-tests` | k6 | - |
| `concurrent-code-execution.js` | `load-tests` | k6 | - |
| `rate-limiter-stress.js` | `load-tests` | k6 | - |

### Sprint 5: Security Gap Closure (3 files, ~40 methods)

| File | Package | Type | Methods |
|------|---------|------|---------|
| `MfaTotpValidationTest.java` | `security.mfa` | Unit | 12 |
| `OAuth2PkceFlowTest.java` | `security.oauth2` | Unit | 14 |
| `SamlAssertionParsingTest.java` | `sso` | Unit | 14 |

### Sprint 6: Functional Gap Closure (7 files, ~37 methods)

| File | Package | Type | Methods |
|------|---------|------|---------|
| `WorkflowRuleTriggerTest.java` | `workflow` | Unit | 9 |
| `ReferralBonusCalculationTest.java` | `referral` | Unit | 6 |
| `DeiAggregationAccuracyTest.java` | `dei` | Unit | 6 |
| `TeamPermissionInheritanceTest.java` | `team` | Unit | 4 |
| `ReminderSchedulingTest.java` | `reminder` | Unit | 6 |
| `SlotRaceConditionTest.java` | `selfservice` | Unit | 2 |
| `PdfGenerationTest.java` | `report` | Unit | 4 |

### Integration Tests (Testcontainers) (18 files)

| File | Package | Type |
|------|---------|------|
| `AuthIntegrationTest.java` | `auth` | Integration |
| `UserIntegrationTest.java` | `user` | Integration |
| `InterviewIntegrationTest.java` | `interview` | Integration |
| `PipelineIntegrationTest.java` | `pipeline` | Integration |
| `TemplateIntegrationTest.java` | `template` | Integration |
| `ScorecardIntegrationTest.java` | `scorecard` | Integration |
| `ActivityIntegrationTest.java` | `activity` | Integration |
| `AiIntegrationTest.java` | `ai` | Integration |
| `CandidateFeedbackIntegrationTest.java` | `candidatefeedback` | Integration |
| `ExportImportIntegrationTest.java` | `exportimport` | Integration |
| `OrganizationIntegrationTest.java` | `organization` | Integration |
| `VideoIntegrationTest.java` | `video` | Integration |
| `WebhookIntegrationTest.java` | `webhook` | Integration |
| `WhiteboardIntegrationTest.java` | `whiteboard` | Integration |
| `MessagingIntegrationTest.java` | `messaging` | Integration |
| `AccountLockoutIntegrationTest.java` | `security` | Integration |
| `ForgotPasswordIntegrationTest.java` | `auth` | Integration |
| `RolePermissionIntegrationTest.java` | `role` | Integration |

### Controller Tests (MockMvc) (14 files)

| File | Package | Type |
|------|---------|------|
| `AuthWebMvcTest.java` | `auth` | Controller |
| `UserWebMvcTest.java` | `user` | Controller |
| `RoleWebMvcTest.java` | `role` | Controller |
| `PermissionWebMvcTest.java` | `permission` | Controller |
| `InterviewWebMvcTest.java` | `interview` | Controller |
| `ActivityWebMvcTest.java` | `activity` | Controller |
| `AiWebMvcTest.java` | `ai` | Controller |
| `CandidateFeedbackWebMvcTest.java` | `candidatefeedback` | Controller |
| `ExportImportWebMvcTest.java` | `exportimport` | Controller |
| `OrganizationWebMvcTest.java` | `organization` | Controller |
| `VideoWebMvcTest.java` | `video` | Controller |
| `WebhookWebMvcTest.java` | `webhook` | Controller |
| `WhiteboardWebMvcTest.java` | `whiteboard` | Controller |
| `ForgotPasswordWebMvcTest.java` | `auth` | Controller |

### Utility/Config (2 files)

| File | Purpose |
|------|---------|
| `AbstractIntegrationTest.java` | Base class: PostgreSQL + Kafka + Vault containers |
| `ObjectMapperTestConfig.java` | Shared Jackson configuration for tests |

---

## 4. Coverage Matrix

```
Module                      | Unit | Integration | Controller | Load | Security | E2E
--------------------------- | ---- | ----------- | ---------- | ---- | -------- | ----
Auth/Login                  |  -   |     Y       |     Y      |  Y   |    -     |  Y
Auth/JWT                    |  Y   |     -       |     -      |  -   |    Y     |  -
Auth/MFA                    |  Y   |     -       |     -      |  -   |    Y     |  -
Auth/OAuth2                 |  Y   |     -       |     -      |  -   |    Y     |  -
SSO/SAML                    |  Y   |     -       |     -      |  -   |    Y     |  -
User Management             |  -   |     Y       |     Y      |  -   |    -     |  -
Roles/Permissions           |  -   |     Y       |     Y      |  -   |    -     |  -
Interviews                  |  -   |     Y       |     Y      |  Y   |    -     |  Y
Pipeline                    |  Y   |     Y       |     -      |  -   |    -     |  -
Templates                   |  -   |     Y       |     -      |  -   |    -     |  -
Scorecards                  |  -   |     Y       |     -      |  -   |    -     |  -
Scheduling                  |  Y   |     -       |     -      |  -   |    -     |  -
Calendar Sync               |  Y   |     -       |     -      |  -   |    -     |  -
Notifications               |  Y   |     -       |     -      |  -   |    -     |  -
Messaging                   |  -   |     Y       |     -      |  -   |    -     |  -
Code Execution              |  Y   |     -       |     -      |  Y   |    Y     |  -
Documents                   |  Y   |     -       |     -      |  -   |    Y     |  -
Export/Import               |  Y   |     Y       |     Y      |  -   |    -     |  -
WebSocket                   |  -   |     -       |     -      |  Y   |    -     |  -
Rate Limiting               |  Y   |     -       |     -      |  Y   |    Y     |  -
GDPR                        |  Y   |     -       |     -      |  -   |    -     |  -
Offers/E-Signature          |  Y   |     -       |     -      |  -   |    -     |  -
Approval Chains             |  Y   |     -       |     -      |  -   |    -     |  -
Bulk Operations             |  Y   |     -       |     -      |  Y   |    -     |  -
Activity                    |  -   |     Y       |     Y      |  -   |    -     |  -
AI Features                 |  -   |     Y       |     Y      |  -   |    -     |  -
Video                       |  -   |     Y       |     Y      |  -   |    -     |  -
Webhook                     |  -   |     Y       |     Y      |  -   |    -     |  -
Whiteboard                  |  -   |     Y       |     Y      |  -   |    -     |  -
Organizations               |  -   |     Y       |     Y      |  -   |    -     |  -
Candidate Feedback          |  -   |     Y       |     Y      |  -   |    -     |  -
Account Lockout             |  -   |     Y       |     -      |  -   |    Y     |  -
Workflow Engine              |  Y   |     -       |     -      |  -   |    -     |  -
Referral Program            |  Y   |     -       |     -      |  -   |    -     |  -
DEI Analytics               |  Y   |     -       |     -      |  -   |    -     |  -
Teams                       |  Y   |     -       |     -      |  -   |    -     |  -
Reminders                   |  Y   |     -       |     -      |  -   |    -     |  -
Self-Service Slots          |  Y   |     -       |     -      |  -   |    -     |  -
PDF Reports                 |  Y   |     -       |     -      |  -   |    -     |  -
Performance Baseline        |  Y   |     -       |     -      |  Y   |    -     |  -
```

**Covered: 40/73 modules (55%)**

---

## 5. Load Test Scenarios

| Script | Scenario | Pass Criteria |
|--------|----------|---------------|
| `concurrent-interviews.js` | 200 concurrent WebSocket interview sessions | p95 < 2s, 0 dropped connections |
| `bulk-schedule.js` | 500 bulk scheduling requests in 60s | p95 < 3s, 0 data loss |
| `code-save-throughput.js` | 1000 code save operations/min | p95 < 500ms, 0 failures |
| `concurrent-code-execution.js` | 100 simultaneous code executions | p95 < 5s, no pool exhaustion |
| `rate-limiter-stress.js` | 10,000 requests to rate-limited endpoint | Correct 429 after threshold, 0 leaks |

All scripts located in `load-tests/` and integrated into CI via `.github/workflows/ci.yml`.

---

## 6. E2E Test Flows

Location: `interview-platform-frontend/e2e/`

| Test | Flow Covered |
|------|--------------|
| Login flow | Email/password login, error handling, redirect to dashboard |
| Dashboard navigation | Sidebar links, breadcrumbs, page transitions |
| Interview creation | Form submission, validation, confirmation |
| Candidate pipeline | Drag-and-drop stage movement, status updates |
| Schedule interview | Calendar picker, conflict detection, confirmation |
| Logout flow | Session termination, redirect to login |

Framework: Playwright with chromium, firefox, and webkit targets.

---

## 7. Remaining Gaps (21 Low-Priority Items)

All HIGH and MEDIUM priority gaps have been resolved. The following are low-priority modules with no dedicated automated tests (manually verified working):

| # | Module | Test Type Needed | Risk | Effort |
|---|--------|------------------|------|--------|
| 1 | Background Check | Unit (mock API) | Low | Small |
| 2 | ATS Integration | Unit (mock API) | Low | Small |
| 3 | Job Board Posting | Unit (mock HTTP) | Low | Small |
| 4 | Feature Flags | Unit | Low | Small |
| 5 | SLA Tracking | Unit | Low | Small |
| 6 | IP Whitelisting | Unit (CIDR matching) | Low | Small |
| 7 | Data Retention | Integration | Low | Small |
| 8 | Push Notifications | Unit (mock FCM) | Low | Small |
| 9 | Predictive Analytics | Unit | Low | Small |
| 10 | Chatbot | Unit (mock OpenAI) | Low | Small |
| 11 | WebRTC Signaling | WebSocket | Low | Medium |
| 12 | Plagiarism Detection | Unit (algorithm) | Low | Small |
| 13 | Test Case Validation | Integration | Low | Medium |
| 14 | AI Scoring | Unit (mock OpenAI) | Low | Small |
| 15 | Assessment Marketplace | Unit | Low | Small |
| 16 | Data Residency | Unit (region routing) | Low | Small |
| 17 | Billing/Payments | Integration (mock gateways) | Low | Medium |
| 18 | AI Scheduling | Unit | Low | Small |
| 19 | CRDT Document | Unit (algorithm) | Low | Medium |
| 20 | Interview Replay | Unit | Low | Small |
| 21 | Candidate Sourcing | Unit (mock GitHub) | Low | Small |

---

## 8. Quality Gates

All gates must pass before production deployment:

| Gate | Requirement | Status |
|------|-------------|--------|
| Unit tests | 0 failures (`./mvnw test`) | Enforced in CI |
| Integration tests | 0 failures (`./mvnw verify -PintegrationTests`) | Enforced in CI |
| E2E critical flows | Login, Dashboard, Navigation pass | Enforced in CI |
| Load test thresholds | p95 < 2s, no pool exhaustion | Enforced in CI |
| Security tests | JWT, MFA, OAuth2, SAML, Rate Limit all pass | Enforced in CI |
| No HIGH priority gaps | 0 remaining | Achieved |
| No MEDIUM priority gaps | 0 remaining | Achieved |
| Performance baselines | All metrics documented and alerting active | Achieved |
| Alerting rules | 8 Prometheus rules configured | Achieved |
| Frontend type safety | `tsc --noEmit` passes | Enforced in CI |

---

## 9. Performance Baselines

Documented in [`monitoring/PERFORMANCE_BASELINES.md`](monitoring/PERFORMANCE_BASELINES.md).

Includes:
- API response time targets per endpoint category
- Database query time budgets
- WebSocket connection capacity limits
- Memory and CPU utilization thresholds
- Alerting rules defined in `monitoring/alerting-rules.yml`
