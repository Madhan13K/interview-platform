# Interview Platform

> AI-powered interview management system — 68 pages, 310+ APIs, live coding, video calls, Stripe billing, enterprise security.

**Repository:** https://github.com/Madhan13K/interview-platform

---

## Quick Start

```bash
# 1. Infrastructure (PostgreSQL + Redis + S3)
cd interview-platform-backend && docker compose up -d

# 2. Backend (localhost:8080)
./mvnw spring-boot:run

# 3. Frontend (localhost:3000)
cd ../interview-platform-frontend && npm install && npm run dev

# 4. Seed test data (optional)
./scripts/seed-test-data.sh
```

**Default login:** `admin@interview.com` / `admin123` (ADMIN role)

---

## What's Included

| Category | What | Count |
|----------|------|-------|
| Frontend Pages | Next.js 16 + React 19 + Tailwind | 68 routes |
| Backend APIs | Spring Boot 4.0.6 + Java 21 | 310+ endpoints |
| Frontend Services | TypeScript API layer | 47 service files |
| Backend Services | Business logic layer | 85+ services |
| Database | PostgreSQL + Flyway | 55+ tables (32 migrations) |
| Security | JWT + OAuth2 + MFA + SSO + Encryption | 21 features |
| Integrations | OpenAI, Stripe, Twilio, Zoom, Firebase, Checkr, DocuSign, Greenhouse, LinkedIn, S3, ClamAV, Daily.co | 15 providers |
| Load Tests | k6 performance scripts | 5 scenarios |
| DevOps | Docker, K8s, GitHub Actions, Prometheus, Grafana | 9 config files |

---

## Features by Role

### Recruiter
Dashboard, Schedule Interviews, Manage Pipelines (Kanban), Create Job Positions, Careers Portal, Send Offers, Referral Program, Bulk Operations, Reports, AI Suggestions, SLA Tracking, Job Board Auto-Posting, ATS Sync, Background Checks, Predictive Analytics

### Interviewer
Conduct Live Sessions (Code Editor + Video + Chat + Whiteboard), Submit Feedback/Scorecards, Question Bank, Interview Kits, View Leaderboard, In-App Messaging, Plagiarism Detection, Test Case Validation

### Candidate
Apply for Jobs, Pick Preferred Time Slots, Join Interview Session, Track Application Status, AI Chatbot, Assessment Marketplace, Self-Service Portal

### Admin
User/Role/Permission Management, Audit Logs, Webhooks, API Keys, MFA, SSO/SAML, GDPR, Billing (Stripe), Feature Flags, Integrations, Workflow Engine, IP Whitelisting, Account Security, Data Retention, Data Residency, Mobile SDK Config

---

## Test Data & Seeding

### Test Accounts (Available After Startup)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@interview.com` | `admin123` |
| Recruiter | `frank@test.com` | `Test@123` |
| Interviewer | `alice@test.com` | `Test@123` |
| Interviewer | `bob@test.com` | `Test@123` |
| Candidate | `charlie@test.com` | `Test@123` |
| Candidate | `diana@test.com` | `Test@123` |
| Candidate | `eve@test.com` | `Test@123` |

### Seed Data Pipeline

Test data is deployed through 3 mechanisms:

| Method | When | What |
|--------|------|------|
| **Flyway V32** | Auto on startup | Users, roles, jobs, interviews, feedback, questions, tags, notifications |
| **Shell Script** | Manual | `./scripts/seed-test-data.sh` — creates data via REST API |
| **GitHub Actions** | On demand | `.github/workflows/deploy-and-seed.yml` — full deploy + seed + verify |

### Local Seeding
```bash
# Option 1: Automatic (Flyway runs V32 on boot)
./mvnw spring-boot:run

# Option 2: Via REST API script
./scripts/seed-test-data.sh

# Option 3: Against a remote environment
BASE_URL=https://your-backend.onrender.com ./scripts/seed-test-data.sh
```

### CI/CD Pipeline Seeding
```
Go to GitHub → Actions → "Deploy & Seed Test Data" → Run workflow
Pipeline: Build → Deploy → Health Check → Seed Data → Verify → Summary
```

### What Gets Seeded

| Module | Test Data Created |
|--------|-------------------|
| **Users** | 6 users across 4 roles (admin, recruiter, interviewers, candidates) |
| **Job Positions** | 3 open positions (Backend, Frontend, DevOps) |
| **Interviews** | 4 interviews (2 completed, 2 scheduled) |
| **Feedback** | 2 interview feedback submissions with ratings |
| **Questions** | 5 questions across 4 categories |
| **Notifications** | 3 unread notifications for recruiter/candidate |
| **Tags** | 4 tags (high-priority, senior-level, remote-ok, needs-follow-up) |

---

## Deploy (Free Cloud Services)

### Option 1: Render (Recommended - Full Stack)

1. Go to https://render.com/deploy
2. Connect GitHub repo: `Madhan13K/interview-platform`
3. Render auto-detects `render.yaml` and provisions:
   - Backend web service (Docker)
   - PostgreSQL database (free)
   - Redis cache (free)

### Option 2: Vercel (Frontend) + Render (Backend)

| Service | Platform | Setup |
|---------|----------|-------|
| Frontend | Vercel | https://vercel.com/import → select repo → root: `interview-platform-frontend` |
| Backend | Render | https://render.com → New Web Service → root: `interview-platform-backend` |

### Option 3: Railway (One-Click)
```bash
npm install -g @railway/cli && railway login
cd interview-platform-backend && railway init && railway up
cd ../interview-platform-frontend && railway init && railway up
```

### Post-Deploy Checklist

- [ ] Update `NEXT_PUBLIC_API_URL` in Vercel to backend URL
- [ ] Set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` in backend
- [ ] Run seed script: `BASE_URL=<backend-url> ./scripts/seed-test-data.sh`
- [ ] Login at frontend with `admin@interview.com` / `admin123`
- [ ] Check `/actuator/health` on backend
- [ ] (Optional) Add API keys: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `TWILIO_*`

---

## Testing Guide

### How to Test Each Feature

| Feature | How to Test | Expected Result |
|---------|-------------|-----------------|
| **Login** | Email: `admin@interview.com`, Pass: `admin123` | Redirects to dashboard |
| **Dashboard** | Navigate to `/dashboard` | Stats cards, charts, activity feed |
| **Interviews** | Go to `/interviews` → Create new | Interview appears in list |
| **Code Editor** | Join interview session → write code → Run | Code executes, output shown |
| **AI Chatbot** | Go to `/chatbot` → "Suggest questions" | AI generates questions |
| **Scheduling** | Go to `/scheduling` → Add availability | Slots saved and visible |
| **Job Positions** | Go to `/jobs` → Create position | Position listed with status |
| **Pipelines** | Go to `/pipelines` → Create → Add candidate | Kanban board with stages |
| **Offers** | Go to `/offers` → Create offer | Offer with approval workflow |
| **Documents** | Go to `/documents` → Upload file | File saved to S3 |
| **Notifications** | Click bell icon in topbar | Unread notification list |
| **MFA** | Go to `/settings/mfa` → Enable | QR code shown |
| **SSO** | Go to `/settings/sso` → Add provider | SAML config saved |
| **Security** | Go to `/settings/security` → Check lockout | Lockout status displayed |
| **Webhooks** | Go to `/settings/webhooks` → Create | Webhook registered |
| **Reports** | Go to `/reports` → View analytics | Charts and PDF download |
| **Workflows** | Go to `/workflows` → Create rule | Automation rule saved |
| **Feature Flags** | `curl /api/v1/feature-flags` | JSON with flag states |
| **SLA Metrics** | `curl /api/v1/sla/metrics` | Recruiter performance data |
| **Predictions** | `curl /api/v1/predictions/time-to-hire` | Predicted days |

### API Testing (curl)
```bash
# Get token
TOKEN=$(curl -s -X POST localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@interview.com","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

# Test any endpoint
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/interviews
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/dashboard/admin
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/feature-flags
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/sla/metrics
```

### Load Testing (k6)
```bash
# Install k6: brew install k6
k6 run load-tests/concurrent-interviews.js     # WebSocket stress
k6 run load-tests/bulk-schedule.js             # DB pool stress
k6 run load-tests/code-save-throughput.js      # Editor throughput
k6 run load-tests/concurrent-code-execution.js # Docker limits
k6 run load-tests/rate-limiter-stress.js       # Redis race conditions
```

---

## Documentation

| Document | Location | Description |
|----------|----------|-------------|
| Backend Audit & Roadmap | [BACKEND_AUDIT_AND_ROADMAP.md](BACKEND_AUDIT_AND_ROADMAP.md) | Architecture, credentials, testing, deployment |
| Backend Roadmap | [interview-platform-backend/ROADMAP.md](interview-platform-backend/ROADMAP.md) | Feature status, bugs, checklist, infra |
| Frontend Technical | [interview-platform-frontend/TECHNICAL_README.md](interview-platform-frontend/TECHNICAL_README.md) | Architecture, API layer, testing all features |
| Frontend User Guide | [interview-platform-frontend/USER_GUIDE.md](interview-platform-frontend/USER_GUIDE.md) | End-user documentation |
| Test Coverage Audit | [TEST_COVERAGE_AUDIT.md](TEST_COVERAGE_AUDIT.md) | Coverage gaps and plan |
| Load Tests | [load-tests/README.md](load-tests/README.md) | Performance test guide |

---

## Tech Stack

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, Axios, shadcn/ui  
**Backend:** Java 21, Spring Boot 4.0.6, Spring Security 7, JPA/Hibernate, WebSocket/STOMP  
**Database:** PostgreSQL 15, Redis 7, Flyway (32 migrations)  
**AI:** OpenAI GPT-4o-mini (structured JSON output, cost tracking)  
**Video:** Native WebRTC + Daily.co fallback, Zoom OAuth  
**Code:** Piston API + Docker sandboxing (7 languages), Plagiarism Detection, Test Case Validation  
**Payments:** Stripe (checkout, subscriptions, webhooks)  
**SMS:** Twilio (interview reminders, notifications)  
**Push:** Firebase Cloud Messaging (Android/iOS)  
**E-Signatures:** DocuSign + Dropbox Sign (real API integration)  
**Background Checks:** Checkr/Sterling API  
**ATS:** Greenhouse, Lever, Workday bidirectional sync  
**Job Boards:** LinkedIn, Indeed, Glassdoor auto-posting  
**Assessments:** HackerRank, Codility, TestGorilla marketplace  
**Virus Scanning:** ClamAV (file upload protection)  
**Feature Flags:** LaunchDarkly / Flagsmith / Local  
**Security:** RSA-256 JWT, OAuth2+PKCE, TOTP MFA, SAML SSO, AES-256-GCM encryption, rate limiting, IP whitelisting  
**DevOps:** Docker, Kubernetes, GitHub Actions, Prometheus, Grafana, k6 load testing

---

## Project Structure

```
interview-platform/
├── interview-platform-backend/     # Spring Boot 4.0.6 (Java 21)
│   ├── src/main/java/             # 85+ services, 65+ controllers
│   ├── src/main/resources/        # 32 Flyway migrations, config
│   ├── src/test/                  # Integration + WebMvc tests
│   ├── Dockerfile                 # Production Docker build
│   └── pom.xml                    # Maven dependencies
├── interview-platform-frontend/    # Next.js 16 (React 19)
│   ├── src/app/                   # 68 page routes
│   ├── src/services/              # 47 API service files
│   ├── src/components/            # 29 UI components
│   ├── src/hooks/                 # 5 custom hooks
│   ├── Dockerfile                 # Production Docker build
│   └── TECHNICAL_README.md        # Frontend architecture docs
├── load-tests/                    # k6 performance test scripts
├── monitoring/                    # Prometheus + Grafana configs
├── k8s/                           # Kubernetes deployment manifests
├── scripts/                       # Utility scripts (seed-test-data.sh)
├── .github/workflows/             # CI/CD + Deploy pipelines
├── render.yaml                    # Render Blueprint (auto-deploy)
├── BACKEND_AUDIT_AND_ROADMAP.md   # Complete technical reference
└── TEST_COVERAGE_AUDIT.md         # Test gap analysis
```
