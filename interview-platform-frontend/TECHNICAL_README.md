# Interview Platform Frontend - Technical Documentation

## Architecture Overview

This is a **Next.js 16** application using the App Router with React 19, TypeScript, and Tailwind CSS. The frontend connects to a Spring Boot 4.0.6 backend running at `http://localhost:8080`.

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.6 | React framework (App Router) |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling + dark mode |
| Zustand | 5.0.13 | Global state management |
| Axios | 1.16.1 | HTTP client |
| React Hook Form | 7.76.1 | Form handling |
| Zod | 4.4.3 | Schema validation |
| Radix UI | 1.4.3 | Accessible component primitives |
| Lucide React | 1.16.0 | Icon library |
| @react-oauth/google | 0.13.5 | Google OAuth integration |

---

## Project Structure

```
interview-platform-frontend/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── (app)/                    # Authenticated layout group
│   │   │   ├── layout.tsx            # Main app layout (sidebar, topbar)
│   │   │   ├── dashboard/            # Dashboard page
│   │   │   ├── interviews/           # Interview CRUD + session
│   │   │   ├── scheduling/           # Scheduling + self-service
│   │   │   ├── jobs/                 # Job positions
│   │   │   ├── pipelines/            # Hiring pipelines
│   │   │   ├── offers/               # Offer letters
│   │   │   ├── questions/            # Question bank
│   │   │   ├── templates/            # Interview templates
│   │   │   ├── teams/                # Team management
│   │   │   ├── documents/            # Document management
│   │   │   ├── ai/                   # AI assistant
│   │   │   ├── chatbot/              # AI chatbot (connected to /api/v1/ai)
│   │   │   ├── reports/              # Analytics reports
│   │   │   ├── workflows/            # Automation rules
│   │   │   ├── approvals/            # Approval workflows
│   │   │   ├── referrals/            # Employee referrals
│   │   │   ├── talent-pool/          # Talent pool (user search/pipeline)
│   │   │   ├── debriefs/             # Interview debriefs (feedback/scorecards)
│   │   │   ├── settings/
│   │   │   │   ├── mfa/             # MFA setup
│   │   │   │   ├── api-keys/        # API key management
│   │   │   │   ├── webhooks/        # Webhook configuration
│   │   │   │   ├── gdpr/            # GDPR/privacy compliance
│   │   │   │   ├── audit/           # Audit logs
│   │   │   │   ├── bulk/            # Bulk operations
│   │   │   │   ├── export/          # Export/Import jobs
│   │   │   │   ├── billing/         # Billing/plans
│   │   │   │   ├── sso/             # SSO/SAML configuration
│   │   │   │   └── security/        # Account lockout/IP blocking
│   │   │   └── ...
│   │   ├── admin/                    # Admin panel (users/roles/permissions)
│   │   ├── login/                    # Login page + OAuth callbacks
│   │   ├── register/                 # Registration
│   │   ├── forgot-password/          # Password reset flow
│   │   └── verify-email/             # Email verification
│   ├── components/
│   │   ├── ui/                       # Reusable UI components (29 files)
│   │   └── auth/                     # Auth guard component
│   ├── services/                     # API service layer (37+ files)
│   ├── hooks/                        # Custom React hooks (5 files)
│   ├── store/                        # Zustand stores
│   ├── lib/                          # Utilities and configurations
│   │   ├── axios.ts                  # Axios instance configuration
│   │   ├── axios-inteceptor.ts       # Request/response interceptors
│   │   ├── api-endpoints.ts          # ALL 230+ backend endpoint mappings
│   │   ├── auth-endpoints.ts         # Auth-specific endpoint helpers
│   │   ├── oauth-popup.ts            # OAuth popup window helper
│   │   └── utils.ts                  # Common utilities (cn, etc.)
│   └── types/                        # TypeScript type definitions
├── public/                           # Static assets
├── next.config.ts                    # Next.js config with API proxy
├── tailwind.config.ts                # Tailwind configuration
├── Dockerfile                        # Multi-stage production build
└── vercel.json                       # Vercel deployment config
```

---

## API Layer Architecture

### Endpoint Mapping (`src/lib/api-endpoints.ts`)

All 230+ backend endpoints are centrally defined as typed constants:

```typescript
export const INTERVIEW_ENDPOINTS = {
  create: "/api/v1/interviews",
  getById: (id: string) => `/api/v1/interviews/${id}`,
  // ...
} as const;
```

### Service Layer (`src/services/`)

Each backend module has a corresponding service file that:
- Imports the appropriate endpoint constants
- Uses the configured Axios instance
- Returns typed responses
- Handles request formatting

**Available Services:**
| Service | File | Backend Module |
|---------|------|---------------|
| auth | `auth.service.ts` | Authentication |
| user | `user.service.ts` | User management |
| interview | `interview.service.ts` | Interview CRUD |
| dashboard | `dashboard.service.ts` | Dashboard stats |
| scheduling | `scheduling.service.ts` | Calendar/scheduling |
| notification | `notification.service.ts` | Notifications |
| ai | `ai.service.ts` | AI features |
| code-execution | `code-execution.service.ts` | Code runner |
| code-editor | `code-editor.service.ts` | Code sessions |
| report | `report.service.ts` | Analytics/PDF |
| document | `document.service.ts` | File management |
| scorecard | `scorecard.service.ts` | Evaluation |
| template | `template.service.ts` | Templates |
| question | `question.service.ts` | Question bank |
| team | `team.service.ts` | Teams |
| pipeline | `pipeline.service.ts` | Pipelines |
| job-position | `job-position.service.ts` | Job openings |
| organization | `organization.service.ts` | Multi-tenant |
| webhook | `webhook.service.ts` | Webhooks |
| activity | `activity.service.ts` | Activity feed |
| audit | `audit.service.ts` | Audit logs |
| gdpr | `gdpr.service.ts` | GDPR compliance |
| mfa | `mfa.service.ts` | Multi-factor auth |
| api-key | `api-key.service.ts` | API keys |
| role | `role.service.ts` | Role management |
| permission | `permission.service.ts` | Permissions |
| bulk | `bulk.service.ts` | Bulk operations |
| export-import | `export-import.service.ts` | Async jobs |
| self-service | `self-service.service.ts` | Candidate slots |
| meeting | `meeting.service.ts` | Video meetings |
| reminder | `reminder.service.ts` | Reminders |
| tag | `tag.service.ts` | Tagging system |
| video | `video.service.ts` | Recordings |
| whiteboard | `whiteboard.service.ts` | Whiteboard |
| candidate-feedback | `candidate-feedback.service.ts` | Reverse feedback |
| sso | `sso.service.ts` | SSO/SAML config |
| security | `security.service.ts` | Account lockout/IP blocking |
| search | `search.service.ts` | Global search |
| analytics | `analytics.service.ts` | Advanced analytics |
| messaging | `messaging.service.ts` | In-app chat/conversations |
| background-check | `background-check.service.ts` | Checkr/Sterling integration |
| ats-integration | `ats-integration.service.ts` | Greenhouse/Lever/Workday sync |
| job-board | `job-board.service.ts` | LinkedIn/Indeed/Glassdoor posting |
| sla | `sla.service.ts` | Recruiter SLA tracking |
| feature-flag | `feature-flag.service.ts` | Feature flag management |
| prediction | `prediction.service.ts` | AI predictions (success/bias) |
| plagiarism | `plagiarism.service.ts` | Code similarity detection |
| marketplace | `marketplace.service.ts` | Assessment provider marketplace |
| webrtc | `webrtc.service.ts` | Native WebRTC video rooms |

### Axios Configuration

**Base Instance** (`src/lib/axios.ts`):
- Base URL: `http://localhost:8080`
- `withCredentials: true` for cookie support

**Interceptors** (`src/lib/axios-inteceptor.ts`):
- **Request**: Auto-attaches JWT Bearer token from Zustand store
- **Response**: Auto-refreshes access token on 401, retries original request

---

## Authentication Flow

### JWT Authentication
1. User logs in via `/api/v1/auth/login`
2. Backend returns `{ accessToken, refreshToken, user }`
3. Tokens stored in Zustand (persisted to localStorage)
4. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
5. On 401 response, interceptor calls `/api/v1/auth/refresh` and retries

### OAuth2
- Google: Uses `@react-oauth/google` for credential flow
- GitHub/Microsoft: Redirect-based flow via backend OAuth2 endpoints

### MFA
- TOTP-based (Google Authenticator compatible)
- Setup flow: QR code -> verify code -> backup codes
- Login challenge: After password auth, prompted for TOTP code

### Route Protection
- `AuthGuard` component wraps authenticated pages
- Checks Zustand store for valid token
- Redirects to `/login` if unauthenticated
- Admin routes check for `ADMIN` role

---

## State Management

### Zustand Store (`src/store/auth.store.ts`)
```typescript
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: UserResponse) => void;
  logout: () => void;
}
```
- Persisted to localStorage
- Hydrated on app initialization
- Single source of truth for auth state

---

## Real-time Communication

### WebSocket Hooks

**`useWebSocket`** - Interview session communication:
- STOMP protocol over WebSocket
- Code sync between participants
- Chat messages
- Participant join/leave
- WebRTC signaling for video

**`useNotificationSocket`** - Push notifications:
- Auto-reconnect on disconnect
- Real-time notification count updates
- Toast alerts for new notifications

### Connection Details
- Endpoint: `ws://localhost:8080/ws?token={JWT}`
- Protocol: STOMP
- Topics: `/topic/interview/{id}`, `/topic/interview/{id}/code`, `/topic/interview/{id}/signal`

---

## Styling & Theming

### Tailwind CSS 4
- Utility-first approach
- Dark mode via class strategy (`dark:` prefix)
- Custom animations via `tw-animate-css`

### Dark Mode
- Toggle component in topbar
- Persisted to localStorage
- Applied via `<html class="dark">`

### Component Variants
- `class-variance-authority` (CVA) for button/badge variants
- `cn()` utility for conditional class merging

---

## Key UI Components (`src/components/ui/`)

| Component | Description |
|-----------|-------------|
| `command-palette.tsx` | Cmd+K navigation/search overlay |
| `code-editor.tsx` | Syntax-highlighted editor (7 languages) |
| `notification-dropdown.tsx` | Real-time notification popup |
| `toast.tsx` | Stacked notification toasts |
| `progress-bar.tsx` | Route-transition loading bar |
| `dark-mode-toggle.tsx` | Theme switcher |
| `calendar-picker.tsx` | Date/time slot selector |
| `video-room.tsx` | Video call component |
| `user-search.tsx` | User autocomplete |
| `empty-state.tsx` | No-data illustrations |

---

## Deployment

### Development
```bash
npm install
npm run dev   # Starts at http://localhost:3000
```
Next.js proxies `/api/*` to `http://localhost:8080/api/*` in development.

### Production
```bash
npm run build
npm start
```

### Docker
```dockerfile
# Multi-stage build (Node 18 Alpine)
docker build -t interview-frontend .
docker run -p 3000:3000 interview-frontend
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend API base URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080/ws` | WebSocket endpoint |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | - | Google OAuth client ID |

---

## Adding New Features

### 1. Add Backend Endpoint Mapping
In `src/lib/api-endpoints.ts`:
```typescript
export const MY_FEATURE_ENDPOINTS = {
  getAll: "/api/v1/my-feature",
  getById: (id: string) => `/api/v1/my-feature/${id}`,
} as const;
```

### 2. Create Service File
In `src/services/my-feature.service.ts`:
```typescript
import api from "@/lib/axios";
import { MY_FEATURE_ENDPOINTS } from "@/lib/api-endpoints";

export const myFeatureService = {
  getAll: async () => {
    const res = await api.get(MY_FEATURE_ENDPOINTS.getAll);
    return res.data;
  },
};
```

### 3. Create Page
In `src/app/(app)/my-feature/page.tsx`:
```typescript
"use client";
import { useState, useEffect } from "react";
import { myFeatureService } from "@/services/my-feature.service";

export default function MyFeaturePage() {
  // Component implementation
}
```

### 4. Add to Navigation
In `src/app/(app)/layout.tsx`, add to the `navigation` array or `settingsLinks` array.

---

## Testing

Currently no automated tests are configured. Recommended setup:
- **Unit tests**: Vitest + React Testing Library
- **E2E tests**: Playwright or Cypress
- **Component tests**: Storybook

---

## Recently Added Features

### New Pages

| Page | Path | Backend API | What It Does |
|------|------|-------------|-------------|
| SSO Configuration | `/settings/sso` | `/api/v1/sso` | CRUD for SAML 2.0 identity providers (Okta, OneLogin, Azure AD) |
| Account Security | `/settings/security` | `/api/v1/security` | Account lockout management, IP blocking, login attempt history |

### Pages Connected to Real Backend (Previously Mock)

| Page | Path | Backend API | Change |
|------|------|-------------|--------|
| AI Chatbot | `/chatbot` | `/api/v1/ai/*` | Was hardcoded keyword responses → now calls real AI endpoints |
| Talent Pool | `/talent-pool` | `/api/v1/users/search` + `/api/v1/pipelines` | Was mock data → now uses user search API with pagination |
| Debriefs | `/debriefs` | `/api/v1/interviews` + `/api/v1/scorecards` | Was mock data → now fetches real interview feedback/scorecards |

### New Services Added

| Service | File | Endpoints Used |
|---------|------|----------------|
| SSO | `src/services/sso.service.ts` | `SSO_ENDPOINTS` (create, update, toggle, delete, getByTenant) |
| Security | `src/services/security.service.ts` | `SECURITY_ENDPOINTS` (lockout, IP blocking, login attempts) |

### New API Endpoints Added

In `src/lib/api-endpoints.ts`:
```typescript
// SSO/SAML Configuration
export const SSO_ENDPOINTS = {
  create, update, getById, getByTenant, toggle, delete, getLoginUrls
};

// Account Security Management  
export const SECURITY_ENDPOINTS = {
  getLockoutStatus, unlockAccount, getBlockedIps, blockIp, unblockIp, getLoginAttempts
};
```

### Navigation Updates

Added to sidebar settings in `src/app/(app)/layout.tsx`:
- "Account Security" → `/settings/security`
- "SSO / SAML" → `/settings/sso`

---

## How to Test New Features

### SSO Configuration Page
```bash
# Navigate to /settings/sso
# 1. Enter a tenant ID (e.g., "default")
# 2. Click "+ Add SSO Provider"
# 3. Select provider type (Okta, OneLogin, Azure AD, Custom)
# 4. Enter Entity ID and Metadata URL
# 5. Toggle enable/disable
# 6. Test: Edit, delete, re-create configurations
```

### Account Security Page
```bash
# Navigate to /settings/security
# Tab 1 - Account Lockout:
#   Enter email → Click "Check Status" → See lockout details → Unlock if locked
# Tab 2 - IP Blocking:
#   Click "Refresh" → See blocked IPs → "Block IP" with reason → Unblock
# Tab 3 - Login Attempts:
#   Enter email → "Search" → See login history (success/failure, IP, user agent)
```

### AI Chatbot (Real Backend)
```bash
# Navigate to /chatbot
# Click "Suggest interview questions" → Enter role/skills → See AI-generated questions
# Click "Parse a resume" → Paste resume text → See structured extraction
# Click "Generate interview summary" → Enter interview ID → See AI summary
# Click "View AI suggestions" → See paginated suggestion history
```

### Talent Pool (Real Backend)
```bash
# Navigate to /talent-pool
# Search by name/email → Results from /api/v1/users/search
# Click "Add Candidate" → Creates user via API
# Click "Add to Pipeline" → Adds to pipeline via API
# Filter by status tabs (Engaged/Nurturing/Ready to Hire)
# Pagination works via backend page/size parameters
```

### Debriefs (Real Backend)
```bash
# Navigate to /debriefs
# Lists recent interviews with their feedback/scorecards
# Click an interview → See participant scorecards with ratings
# Record hiring decision (Strong Hire/Hire/No Hire/Strong No Hire)
# Filter by status (Scheduled/In Progress/Completed)
```

---

## Performance Optimizations

- Next.js standalone output mode for smaller Docker images
- Image optimization via Next.js `<Image>`
- Code splitting via App Router (automatic per-page)
- Lazy-loaded components for modals/heavy UI
- Axios response caching via interceptors (where appropriate)
- Skeleton loading states for better perceived performance

---

## Security Considerations

- JWT tokens stored in memory (Zustand) with localStorage backup
- HttpOnly cookie support via `withCredentials: true`
- XSS prevention via React's built-in escaping
- CSRF protection via token-based auth (not cookies for API calls)
- Rate limiting handled server-side
- Sensitive routes protected by AuthGuard + role checks

---

## Complete Backend API Coverage

### All Service → Backend Endpoint Mappings (47 services total)

| Category | Services | Backend Modules |
|----------|----------|-----------------|
| **Auth** | auth, mfa, api-key, sso, security | JWT, OAuth2, MFA, SAML, Lockout |
| **Users** | user, role, permission | RBAC, Profiles |
| **Interviews** | interview, dashboard, scheduling, meeting, reminder | CRUD, Stats, Calendar |
| **Pipeline** | pipeline, job-position, self-service | Hiring stages |
| **Content** | question, template, scorecard, tag | Question bank, Templates |
| **Code** | code-editor, code-execution, plagiarism | Live editor, Docker sandbox |
| **AI** | ai, prediction | OpenAI, ML predictions |
| **Docs** | document, video, whiteboard | S3, Recordings |
| **Communication** | notification, messaging, webrtc | Push, Chat, Video |
| **Analytics** | report, analytics, sla, activity | PDF, Metrics, SLA |
| **Integrations** | webhook, ats-integration, job-board, marketplace | ATS, Job boards |
| **Admin** | audit, gdpr, bulk, export-import, feature-flag | Compliance, Ops |
| **Commerce** | organization, background-check | Multi-tenant, Checkr |

---

## How to Test ALL New Backend Features from Frontend

### Prerequisites
```bash
# Backend running at localhost:8080
cd interview-platform-backend && ./mvnw spring-boot:run

# Frontend running at localhost:3000
cd interview-platform-frontend && npm run dev

# Login as admin: admin@interview.com / admin123
```

### 1. Messaging / Chat (NEW)
```bash
# API: POST/GET /api/v1/messaging/conversations, /messages
# Service: messaging.service.ts
# Test via browser console or integrations page:
import { messagingService } from '@/services/messaging.service';

# Create conversation
const conv = await messagingService.createConversation({
  participantIds: ['<user-id>'],
  type: 'DIRECT'
});

# Send message
await messagingService.sendMessage(conv.id, { content: 'Hello!', type: 'TEXT' });

# Get messages
const msgs = await messagingService.getMessages(conv.id);
```

### 2. Background Checks (NEW)
```bash
# API: POST /api/v1/background-checks/initiate, GET /{checkId}/status
# Service: background-check.service.ts
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/background-checks/initiate \
  -d '{"candidateEmail":"test@example.com","candidateName":"John Doe","packageType":"standard"}'
```

### 3. ATS Integration (NEW)
```bash
# API: POST /api/v1/integrations/ats/{provider}/sync
# Service: ats-integration.service.ts
curl -X POST -H "Authorization: Bearer $TOKEN" \
  localhost:8080/api/v1/integrations/ats/greenhouse/sync
```

### 4. Job Board Auto-Posting (NEW)
```bash
# API: POST /api/v1/job-boards/post-all
# Service: job-board.service.ts
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/job-boards/post-all \
  -d '{"title":"Senior Engineer","description":"Great role","location":"Remote","employmentType":"FULL_TIME","applyUrl":"https://careers.example.com/apply"}'
```

### 5. Recruiter SLA Tracking (NEW)
```bash
# API: GET /api/v1/sla/metrics, /workload, /bottlenecks
# Service: sla.service.ts
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/sla/metrics
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/sla/workload
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/sla/bottlenecks
```

### 6. Feature Flags (NEW)
```bash
# API: GET/PUT /api/v1/feature-flags
# Service: feature-flag.service.ts
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/feature-flags
curl -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/feature-flags/video_interviews -d '{"enabled":true}'
```

### 7. Predictive Analytics (NEW)
```bash
# API: GET /api/v1/predictions/candidate/{id}/success
# Service: prediction.service.ts
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/predictions/candidate/<uuid>/success
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/predictions/interviewer/<uuid>/bias
curl -H "Authorization: Bearer $TOKEN" "localhost:8080/api/v1/predictions/time-to-hire?department=Engineering&level=Senior"
```

### 8. Plagiarism Detection (NEW)
```bash
# API: POST /api/v1/plagiarism/check, /compare
# Service: plagiarism.service.ts
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/plagiarism/check \
  -d '{"code":"function sort(arr) { return arr.sort(); }","language":"javascript","corpus":["function sort(a) { return a.sort(); }"]}'
```

### 9. Test Case Validation (NEW)
```bash
# API: POST /api/v1/test-cases/validate
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/test-cases/validate \
  -d '{"code":"n=int(input())\nprint(n*2)","language":"python","timeLimitMs":10000,"testCases":[{"input":"5","expectedOutput":"10","isHidden":false,"description":"double it","points":1}]}'
```

### 10. Assessment Marketplace (NEW)
```bash
# API: GET /api/v1/marketplace/assessments/providers
# Service: marketplace.service.ts
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/marketplace/assessments/providers
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/marketplace/assessments/providers/hackerrank/assessments
```

### 11. Native WebRTC Video (NEW)
```bash
# API: POST /api/v1/video/webrtc/rooms/{id}/join
# Service: webrtc.service.ts
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/video/webrtc/rooms/test-room-1/join \
  -d '{"displayName":"John"}'
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/video/webrtc/rooms/test-room-1/status
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/video/webrtc/ice-servers
```

### 12. AI Interview Scoring (NEW)
```bash
# API: POST /api/v1/ai-scoring/analyze
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/ai-scoring/analyze \
  -d '{"transcript":"Interviewer: Tell me about yourself. Candidate: I have 5 years experience...","role":"Backend Engineer","interviewType":"TECHNICAL"}'
```

### 13. Data Residency (NEW)
```bash
# API: GET /api/v1/data-residency/region, /compliance
curl -H "Authorization: Bearer $TOKEN" "localhost:8080/api/v1/data-residency/region?countryCode=DE"
curl -H "Authorization: Bearer $TOKEN" "localhost:8080/api/v1/data-residency/compliance?orgCountry=FR"
curl -H "Authorization: Bearer $TOKEN" "localhost:8080/api/v1/data-residency/validate-transfer?sourceCountry=DE&destinationCountry=US"
```

### 14. IP Whitelisting (NEW)
```bash
# API: GET/POST /api/v1/organizations/{orgId}/ip-whitelist
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/organizations/<org-id>/ip-whitelist \
  -d '{"ipAddress":"192.168.1.0/24","description":"Office network"}'
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/organizations/<org-id>/ip-whitelist
```

### 15. Billing / Stripe (NEW)
```bash
# API: POST /api/v1/billing/checkout, /portal
# Requires app.billing.enabled=true and Stripe API key
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/billing/checkout \
  -d '{"customerId":"cus_xxx","priceId":"price_xxx","successUrl":"http://localhost:3000/settings/billing","cancelUrl":"http://localhost:3000/settings/billing"}'
```

### 16. Real AI (OpenAI) - Updated
```bash
# Now calls real OpenAI API when OPENAI_API_KEY is configured
# Falls back to mock responses if no key
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/ai/suggest-questions \
  -d '{"jobTitle":"React Developer","difficulty":"MEDIUM","category":"TECHNICAL","count":3,"skills":["React","TypeScript"]}'
```

### 17. Real Zoom Meetings - Updated
```bash
# Now calls real Zoom API when credentials configured
# Requires: app.meeting.zoom.account-id, client-id, client-secret
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/interviews/<id>/meeting \
  -d '{"provider":"ZOOM"}'
```

### 18. Real SMS (Twilio) - Updated
```bash
# Now sends real SMS when Twilio credentials are configured
# Requires: app.twilio.account-sid, auth-token, from-number
# SMS is sent automatically on interview reminders when candidate has phone number
```

### 19. AI Interview Coach (Phase 13)
```bash
# Real-time coaching during live interview sessions
# Technical: Analyzes transcript → generates follow-ups + detects bias + tracks time
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/ai/coach/suggest \
  -d '{"recentTranscript":"Candidate explained their approach to system design...","jobTitle":"Senior Engineer","competencies":["system-design","leadership","problem-solving"],"elapsedMinutes":25,"totalMinutes":60}'
# Returns: { followUpQuestions: [...], biasAlerts: [...], timeAlert: "...", coverage: {...} }
```

### 20. Smart Talent Matching (Phase 13)
```bash
# AI matches candidates to open job positions
# Technical: Scores on skill overlap (50%) + experience level (30%) + historical fit (20%)
curl -H "Authorization: Bearer $TOKEN" \
  "localhost:8080/api/v1/talent-match/job/<jobPositionId>?maxResults=10"
# Returns: [{ candidateId, name, overallScore, scoreBreakdown: {skills, experience, historicalFit}, matchReason }]
```

### 21. Automated Screening Bot (Phase 13)
```bash
# Generate screening questions for a role
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/screening/questions \
  -d '{"jobTitle":"React Developer","requirements":"React, TypeScript, 3+ years","questionCount":5}'

# Evaluate candidate responses (AI grades pass/fail)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/screening/evaluate \
  -d '{"jobTitle":"React Developer","requirements":"React, TypeScript","responses":[{"question":"Years of experience?","answer":"5 years with React and TypeScript"}]}'
# Returns: { score: 8, recommendation: "PASS", strengths: [...], concerns: [...] }
```

### 22. Sentiment Analysis (Phase 13)
```bash
# Analyze candidate engagement from text
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/sentiment/analyze \
  -d '{"text":"I am really excited about this opportunity. I have been passionate about distributed systems for 5 years and would love to contribute to your team."}'
# Returns: { sentimentScore: 0.82, engagementScore: 0.75, label: "POSITIVE", details: {...} }
```

### 23. Compensation Intelligence (Phase 13)
```bash
# Get salary recommendation for a role
curl -H "Authorization: Bearer $TOKEN" \
  "localhost:8080/api/v1/compensation/recommend?level=SENIOR&location=Bangalore&department=Engineering&currency=INR"
# Returns: { currency: "INR", recommendedMin: 2500000, recommendedTarget: 3500000, recommendedMax: 5000000, marketMin: ..., insights: [...] }

# Assess if an offer is competitive
curl -H "Authorization: Bearer $TOKEN" \
  "localhost:8080/api/v1/compensation/assess?amount=3000000&level=SENIOR&location=India"
# Returns: { percentile: 62.5, rating: "COMPETITIVE" }
```

### 24. Attrition Risk Prediction (Phase 13)
```bash
# Predict if a hired candidate will leave within 6 months
curl -H "Authorization: Bearer $TOKEN" \
  localhost:8080/api/v1/predictions/attrition/<candidateId>
# Returns: { riskScore: 0.45, riskLevel: "MEDIUM", riskFactors: ["salary gap", "long process"], mitigations: ["signing bonus", "strong onboarding"] }
```

### 25. Difficulty Calibration (Phase 13)
```bash
# Get next question difficulty based on candidate performance
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/ai/calibrate \
  -d '{"performanceHistory":[{"difficulty":"MEDIUM","score":0.9,"competency":"algorithms"},{"difficulty":"HARD","score":0.7,"competency":"system-design"}]}'
# Returns: { nextDifficulty: "HARD", abilityEstimate: 0.78, reason: "Strong performance - increasing difficulty" }
```

### 26. Multi-Gateway Payments (Phase 12)
```bash
# Create Razorpay order (India - UPI/Cards/NetBanking)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/billing/razorpay/order \
  -d '{"amount":11999,"currency":"INR","description":"Professional Plan - Monthly"}'
# Returns: { id: "order_xxx", amount: 1199900, currency: "INR" }

# Verify Razorpay payment
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/billing/razorpay/verify \
  -d '{"razorpay_order_id":"order_xxx","razorpay_payment_id":"pay_xxx","razorpay_signature":"..."}'

# Create Stripe checkout (International)
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/billing/checkout \
  -d '{"customerId":"cus_xxx","priceId":"price_xxx","successUrl":"http://localhost:3000/billing","cancelUrl":"http://localhost:3000/billing"}'
```

### 27. CRDT Collaborative Editing (Innovation)
```bash
# Get document content
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/crdt/documents/<docId>

# Apply operation (via WebSocket in practice)
# Subscribe: /topic/document/{docId}/ops
# Send: /app/document/{docId}/op
# Payload: { type: "INSERT", charId: "site1-42", character: "a", afterId: "site1-41", siteId: "site1", timestamp: 42 }
```

### 28. Interview Replay (Innovation)
```bash
# Get full replay timeline for an interview
curl -H "Authorization: Bearer $TOKEN" \
  localhost:8080/api/v1/replay/<interviewId>/timeline
# Returns: { startTime, endTime, durationSeconds, totalEvents, events: [{ type: "CODE_CHANGE"|"WHITEBOARD_STROKE"|"FEEDBACK_SUBMITTED", timestamp, data }] }

# Get events in a time range (for scrubbing)
curl -H "Authorization: Bearer $TOKEN" \
  "localhost:8080/api/v1/replay/<interviewId>/range?from=2026-01-01T10:00:00Z&to=2026-01-01T10:30:00Z"
```

### 29. AI-Powered Scheduling (Innovation)
```bash
# Get AI-suggested optimal interview slots
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/scheduling/ai-suggest \
  -d '{"interviewerId":"<uuid>","candidateId":"<uuid>","durationMinutes":60,"timeZone":"Asia/Kolkata","maxSuggestions":5}'
# Returns: [{ startTime, endTime, score: 0.92, reason: "Low no-show rate; Tue/Wed best completion; high ratings at 10am" }]

# Predict no-show probability for a specific slot
curl -H "Authorization: Bearer $TOKEN" \
  "localhost:8080/api/v1/scheduling/no-show-risk?scheduledTime=2026-07-15T10:00:00Z&candidateId=<uuid>"
# Returns: { probability: 0.08 }
```

### 30. Candidate Sourcing AI (Innovation)
```bash
# Search GitHub for candidates matching skills
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/sourcing/github \
  -d '{"skills":["react","typescript","node"],"location":"India","maxResults":20}'
# Returns: [{ name, profileUrl, source: "GITHUB", skills, relevanceScore }]

# Extract skills from job description using AI
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  localhost:8080/api/v1/sourcing/extract-skills \
  -d '{"jobDescription":"We need a senior engineer with experience in microservices, Kubernetes, and Go..."}'
# Returns: { skills: ["go", "kubernetes", "microservices", "docker"] }
```

---

## Additional Credentials for New Features

| Feature | Credential | Where to Get | Required? |
|---------|-----------|--------------|-----------|
| AI Features (13 services) | `OPENAI_API_KEY` | platform.openai.com/api-keys | Yes (falls back to mock without) |
| Razorpay | `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` | dashboard.razorpay.com | Only for Indian payments |
| PayU | `PAYU_MERCHANT_KEY` + `PAYU_MERCHANT_SALT` | payu.in/merchant-dashboard | Only for Indian payments |
| Cashfree | `CASHFREE_APP_ID` + `CASHFREE_SECRET_KEY` | merchant.cashfree.com | Only for Indian payments |
| PhonePe | `PHONEPE_MERCHANT_ID` + `PHONEPE_SALT_KEY` | developer.phonepe.com | Only for Indian payments |
| Stripe | `STRIPE_SECRET_KEY` | dashboard.stripe.com/apikeys | Only for international payments |
| GitHub Sourcing | `GITHUB_TOKEN` (PAT) | github.com/settings/tokens | Only for candidate sourcing |
| Twilio SMS | `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM_NUMBER` | twilio.com | Only for SMS |
| Firebase Push | `FIREBASE_CREDENTIALS_PATH` | console.firebase.google.com | Only for mobile push |
| Zoom Meetings | `ZOOM_ACCOUNT_ID` + `ZOOM_CLIENT_ID` + `ZOOM_CLIENT_SECRET` | marketplace.zoom.us | Only for Zoom video |
| DocuSign | `DOCUSIGN_ACCOUNT_ID` + `DOCUSIGN_ACCESS_TOKEN` | developers.docusign.com | Only for e-signatures |
| ClamAV | `CLAMAV_HOST` + `CLAMAV_PORT` | Run: `docker run -p 3310:3310 clamav/clamav` | Only for virus scanning |

> All features work without credentials - they gracefully fall back to mock/log behavior.

---

## File Summary (Complete)

### API Endpoints (`src/lib/api-endpoints.ts`)
16 endpoint groups: MESSAGING, BACKGROUND_CHECK, ATS, JOB_BOARD, SLA, FEATURE_FLAG, BILLING, PREDICTION, CHATBOT, WEBRTC, PLAGIARISM, TEST_CASE, DATA_RESIDENCY, AI_SCORING, MARKETPLACE, IP_WHITELIST

### Services (`src/services/`) — 49 total
Core: auth, user, interview, dashboard, scheduling, notification, ai, code-execution, code-editor, report, document, scorecard, template, question, team, pipeline, job-position, organization, webhook, activity, audit, gdpr, mfa, api-key, role, permission, bulk, export-import, self-service, meeting, reminder, tag, video, whiteboard, candidate-feedback, sso, security, search, analytics

New: messaging, background-check, ats-integration, job-board, sla, feature-flag, prediction, plagiarism, marketplace, webrtc

### Pages (`src/app/(app)/`) — 68 total
Including new: `/settings/sso`, `/settings/security`

### Total Frontend → Backend Coverage: 49 service files mapping to 320+ API endpoints
