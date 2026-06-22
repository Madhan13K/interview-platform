# Interview Platform

> AI-powered interview management system — 68 pages, 310+ APIs, live coding, video calls, Stripe billing, enterprise security.

---

## Quick Start

```bash
# 1. Infrastructure (PostgreSQL + Redis + S3)
cd interview-platform-backend && docker compose up -d

# 2. Backend (localhost:8080)
./mvnw spring-boot:run

# 3. Frontend (localhost:3000)
cd ../interview-platform-frontend && npm install && npm run dev
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
| Database | PostgreSQL + Flyway | 55+ tables (31 migrations) |
| Security | JWT + OAuth2 + MFA + SSO + Encryption | 21 features |
| Integrations | OpenAI, Stripe, Twilio, Zoom, Firebase, Checkr, DocuSign, Greenhouse, LinkedIn, S3, ClamAV, Daily.co | 15 providers |
| Load Tests | k6 performance scripts | 5 scenarios |
| DevOps | Docker, K8s, GitHub Actions, Prometheus, Grafana | 8 config files |

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

## Deploy (Free)

| Platform | What | Command |
|----------|------|---------|
| **Vercel** | Frontend | Connect GitHub at vercel.com |
| **Railway** | Backend + DB + Redis | `railway init && railway up` |
| **Render** | Full stack | Push to GitHub, uses `render.yaml` |

---

## Documentation

| Document | Location | Description |
|----------|----------|-------------|
| Backend Audit & Roadmap | [BACKEND_AUDIT_AND_ROADMAP.md](BACKEND_AUDIT_AND_ROADMAP.md) | Architecture, credentials, testing, deployment |
| Frontend Technical | [interview-platform-frontend/TECHNICAL_README.md](interview-platform-frontend/TECHNICAL_README.md) | Architecture, API layer, auth flow, adding features |
| Frontend User Guide | [interview-platform-frontend/USER_GUIDE.md](interview-platform-frontend/USER_GUIDE.md) | End-user documentation for all features |

---

## Tech Stack

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, Axios, shadcn/ui  
**Backend:** Java 21, Spring Boot 4.0.6, Spring Security 7, JPA/Hibernate, WebSocket/STOMP  
**Database:** PostgreSQL 15, Redis 7, Flyway  
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
