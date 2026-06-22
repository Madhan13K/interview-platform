# Test Coverage Audit & Gap Analysis

## Current Test Coverage

### Existing Tests (32 total)

| Category | Count | Modules Covered |
|----------|-------|-----------------|
| Integration Tests | 17 | Auth, User, Interview, Pipeline, Template, Scorecard, Activity, AI, CandidateFeedback, ExportImport, Organization, Video, Webhook, Whiteboard |
| WebMvc (Controller) Tests | 14 | Auth, User, Role, Permission, Interview, Activity, AI, CandidateFeedback, ExportImport, Organization, Video, Webhook, Whiteboard |
| Test Config/Utility | 1 | ObjectMapper config |

### Test Infrastructure
- **Framework**: JUnit 5 + Spring Boot Test
- **Containers**: Testcontainers (PostgreSQL, Kafka, Vault)
- **Mocking**: Spring MockMvc for controllers
- **Profiles**: `application-integration.yml` for test config

---

## Coverage Gaps (Modules WITHOUT Tests)

### Critical (P0 - Must have tests)

| # | Module | Type Needed | Risk if Untested |
|---|--------|-------------|-----------------|
| 1 | **Security/JWT** | Unit + Integration | Token forgery, auth bypass |
| 2 | **Security/MFA** | Integration | MFA bypass, backup code reuse |
| 3 | **Security/OAuth2** | Integration | OAuth state manipulation |
| 4 | **Rate Limiting** | Integration + Load | DDoS vulnerability, race conditions |
| 5 | **Account Lockout** | Integration | Brute force vulnerability |
| 6 | **Code Execution** | Integration + Security | Container escape, resource exhaustion |
| 7 | **Document Upload** | Integration | Malicious file upload, path traversal |
| 8 | **Offer/E-Signature** | Integration | Workflow integrity, signature spoofing |

### High (P1 - Should have tests)

| # | Module | Type Needed | Risk if Untested |
|---|--------|-------------|-----------------|
| 9 | **Scheduling** | Unit + Integration | Double-booking, timezone bugs |
| 10 | **Calendar Sync** | Integration | Data loss on sync conflicts |
| 11 | **Notification (Email/SMS)** | Unit (mocked) | Silent notification failures |
| 12 | **Pipeline/Stages** | Integration | Stage skipping, state corruption |
| 13 | **Messaging** | WebSocket + Integration | Message loss, auth bypass |
| 14 | **Job Position/Board** | Integration | Public data exposure |
| 15 | **GDPR (Erasure)** | Integration | Incomplete data deletion (compliance risk) |
| 16 | **Bulk Operations** | Integration + Load | Partial failures, inconsistent state |

### Medium (P2 - Nice to have)

| # | Module | Type Needed | Risk if Untested |
|---|--------|-------------|-----------------|
| 17 | **SSO/SAML** | Integration | SSO configuration errors |
| 18 | **Workflow Engine** | Unit + Integration | Rule misfiring, infinite loops |
| 19 | **Tags** | Unit | Tag orphaning |
| 20 | **Teams** | Unit | Permission inheritance bugs |
| 21 | **Reminder** | Unit | Missed reminders |
| 22 | **Self-Service** | Integration | Slot conflict races |
| 23 | **Report/PDF** | Unit | PDF generation crashes |
| 24 | **Approval Chain** | Integration | Stuck approvals |
| 25 | **Referral** | Unit | Bonus calculation errors |
| 26 | **DEI Analytics** | Unit | Incorrect aggregation |

### New Modules (P3 - Need initial tests)

| # | Module | Type Needed |
|---|--------|-------------|
| 27 | **Background Check** | Integration (mock API) |
| 28 | **ATS Integration** | Integration (mock API) |
| 29 | **Job Board Posting** | Unit (mock HTTP) |
| 30 | **Feature Flags** | Unit |
| 31 | **Billing/Stripe** | Integration (mock Stripe) |
| 32 | **SLA Tracking** | Unit |
| 33 | **IP Whitelisting** | Unit + Integration |
| 34 | **Data Retention** | Integration |
| 35 | **Push Notifications** | Unit (mock FCM) |
| 36 | **Predictive Analytics** | Unit |
| 37 | **Chatbot** | Unit (mock OpenAI) |
| 38 | **WebRTC Signaling** | WebSocket |
| 39 | **Plagiarism Detection** | Unit |
| 40 | **Test Case Validation** | Integration |
| 41 | **AI Scoring** | Unit (mock OpenAI) |
| 42 | **Assessment Marketplace** | Unit |

---

## Test Coverage Matrix

```
Module                      | Unit | Integration | Controller | Load | Security
--------------------------- | ---- | ----------- | ---------- | ---- | --------
Auth/Login                  |  -   |     ✓       |     ✓      |  ✓*  |    -
Auth/JWT                    |  -   |     -       |     -      |  -   |    -  ⚠️
Auth/MFA                    |  -   |     -       |     -      |  -   |    -  ⚠️
Auth/OAuth2                 |  -   |     -       |     -      |  -   |    -  ⚠️
User Management             |  -   |     ✓       |     ✓      |  -   |    -
Roles/Permissions           |  -   |     ✓       |     ✓      |  -   |    -
Interviews                  |  -   |     ✓       |     ✓      |  ✓*  |    -
Pipeline                    |  -   |     ✓       |     -      |  -   |    -
Templates                   |  -   |     ✓       |     -      |  -   |    -
Scorecards                  |  -   |     ✓       |     -      |  -   |    -
Scheduling                  |  -   |     -       |     -      |  -   |    -  ⚠️
Calendar Sync               |  -   |     -       |     -      |  -   |    -
Notifications               |  -   |     -       |     -      |  -   |    -
Messaging (new)             |  -   |     -       |     -      |  -   |    -
Code Execution              |  -   |     -       |     -      |  ✓*  |    -  ⚠️
Documents                   |  -   |     -       |     -      |  -   |    -  ⚠️
Export/Import               |  -   |     ✓       |     ✓      |  -   |    -
WebSocket                   |  -   |     -       |     -      |  ✓*  |    -
Rate Limiting               |  -   |     -       |     -      |  ✓*  |    -  ⚠️
GDPR                        |  -   |     -       |     -      |  -   |    -  ⚠️
Offers/E-Signature          |  -   |     -       |     -      |  -   |    -
Activity                    |  -   |     ✓       |     ✓      |  -   |    -
AI Features                 |  -   |     ✓       |     ✓      |  -   |    -
Video                       |  -   |     ✓       |     ✓      |  -   |    -
Webhook                     |  -   |     ✓       |     ✓      |  -   |    -
Whiteboard                  |  -   |     ✓       |     ✓      |  -   |    -
Organizations               |  -   |     ✓       |     ✓      |  -   |    -
Candidate Feedback          |  -   |     ✓       |     ✓      |  -   |    -

✓  = Test exists
✓* = Load test exists (in load-tests/ directory)
-  = No test
⚠️  = High risk gap
```

---

## Recommended Test Implementation Plan

### Sprint 1 (Critical Security Tests)
1. JWT token validation/expiry tests
2. Rate limiter accuracy tests (unit)
3. Account lockout integration tests
4. Code execution sandboxing security tests
5. Document upload validation tests

### Sprint 2 (Core Workflow Tests)
1. Scheduling conflict detection tests
2. Pipeline state machine tests
3. Messaging persistence + WebSocket tests
4. Notification delivery tests (mocked)
5. GDPR erasure completeness tests

### Sprint 3 (Integration Tests)
1. E-Signature workflow tests (mocked)
2. Bulk operation partial failure tests
3. Calendar sync conflict tests
4. Approval chain flow tests
5. Export/Import Excel format tests

### Sprint 4 (Performance Validation)
1. Run all k6 load tests against staging
2. Document baseline metrics
3. Configure alerting thresholds
4. Add load tests to CI/CD pipeline
5. Create performance regression tests

---

## Running Tests

```bash
# Unit + WebMvc tests only (fast, no Docker needed)
./mvnw test

# Integration tests (requires Docker for Testcontainers)
./mvnw verify -PintegrationTests

# All tests
./mvnw verify

# Load tests (requires running backend)
cd load-tests && k6 run concurrent-interviews.js

# Coverage report (if JaCoCo is added)
./mvnw test jacoco:report
```

---

## Estimated Coverage (Before This Audit)

| Metric | Estimate |
|--------|----------|
| **Line coverage** | ~25-30% |
| **Branch coverage** | ~15-20% |
| **Module coverage** | 17/75 modules (23%) |
| **Critical path coverage** | ~40% |

### Target Coverage

| Metric | Target |
|--------|--------|
| **Line coverage** | 60%+ |
| **Branch coverage** | 50%+ |
| **Module coverage** | 50/75 modules (67%) |
| **Critical path coverage** | 90%+ |
| **Security-sensitive code** | 95%+ |
