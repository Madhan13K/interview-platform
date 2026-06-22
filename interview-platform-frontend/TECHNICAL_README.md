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

---

## File Summary (New Files Added)

### API Endpoints (`src/lib/api-endpoints.ts`)
Added 14 new endpoint groups: MESSAGING, BACKGROUND_CHECK, ATS, JOB_BOARD, SLA, FEATURE_FLAG, BILLING, PREDICTION, CHATBOT, WEBRTC, PLAGIARISM, TEST_CASE, DATA_RESIDENCY, AI_SCORING, MARKETPLACE, IP_WHITELIST

### Services (`src/services/`)
Added 10 new service files: `messaging.service.ts`, `background-check.service.ts`, `ats-integration.service.ts`, `job-board.service.ts`, `sla.service.ts`, `feature-flag.service.ts`, `prediction.service.ts`, `plagiarism.service.ts`, `marketplace.service.ts`, `webrtc.service.ts`

### Pages (`src/app/(app)/settings/`)
Added 2 new pages: `settings/sso/page.tsx`, `settings/security/page.tsx`

### Total Frontend Service Count: 47 files covering 310+ backend API endpoints
