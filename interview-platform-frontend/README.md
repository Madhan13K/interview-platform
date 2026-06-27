# Interview Platform - Full Stack Application

A comprehensive AI-powered interview management platform with a Spring Boot backend and Next.js frontend, featuring real-time collaboration, code editor, calendar scheduling, MFA security, and Zepto/Blinkit-inspired interactive UI.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 16)                          │
│                        http://localhost:3000                           │
│                                                                       │
│  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  96 Pages │  │70 Services│  │  Zustand │  │  UI Components    │  │
│  │(App Router)│  │  (Axios) │  │  (Store) │  │(shadcn + custom)  │  │
│  └───────────┘  └──────────┘  └──────────┘  └───────────────────┘  │
│                                                                       │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────────────┐    │
│  │ Code Editor  │  │  Calendar  │  │  Command Palette (Cmd+K) │    │
│  │(Syntax HL)   │  │  (Picker)  │  │  Dark Mode + Animations  │    │
│  └──────────────┘  └────────────┘  └──────────────────────────┘    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ REST API (JSON) + WebSocket (STOMP)
                                │ JWT Bearer Auth + OAuth2 + MFA
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend (Spring Boot 4.0.6)                        │
│                     http://localhost:8080                              │
│                                                                       │
│  ┌────────────┐  ┌──────────┐  ┌───────────┐  ┌────────────────┐  │
│  │40 Controllers│ │ Services │  │   Repos   │  │   Security     │  │
│  │ (220+ APIs)  │ │(Business)│  │   (JPA)   │  │(OAuth+JWT+MFA) │  │
│  └────────────┘  └──────────┘  └───────────┘  └────────────────┘  │
│                                                                       │
│  ┌──────────┐  ┌─────────┐  ┌────────┐  ┌─────────────────────┐   │
│  │  Kafka   │  │  Redis  │  │  S3    │  │    PostgreSQL       │   │
│  │(Events)  │  │(Cache)  │  │(Files) │  │    (Database)       │   │
│  └──────────┘  └─────────┘  └────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| Next.js 16.2.6 | React framework (App Router) |
| React 19 | UI library |
| TypeScript 5 | Type safety |
| Tailwind CSS 4 | Styling + animations |
| Zustand 5 | State management |
| Axios | HTTP client |
| React Hook Form + Zod | Form handling & validation |
| Radix UI + shadcn/ui | UI component primitives |
| Lucide React | Icons |
| Custom Code Editor | Syntax-highlighted code editing |
| Custom Calendar Picker | Interview scheduling |

### Backend
| Technology | Purpose |
|-----------|---------|
| Java 21 | Language |
| Spring Boot 4.0.6 | Framework |
| Spring Security | Auth (OAuth2, JWT, MFA/TOTP) |
| Spring Data JPA | Database access |
| Spring WebSocket | Real-time collaboration |
| PostgreSQL | Primary database |
| Redis | Caching & sessions |
| Apache Kafka | Event streaming |
| AWS S3 | File storage |
| Flyway | Database migrations |
| OpenAPI/Swagger | API documentation |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Java 21+
- PostgreSQL 15+
- Redis 7+
- Maven 3.9+

### Backend Setup

```bash
cd interview-platform-backend

# Configure your .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your database, OAuth, and service credentials

# Run with Maven
./mvnw spring-boot:run
# Backend starts at http://localhost:8080
# Swagger UI: http://localhost:8080/swagger-ui.html
```

### Frontend Setup

```bash
cd interview-platform-frontend

# Install dependencies
npm install

# Environment is pre-configured:
# .env.local -> NEXT_PUBLIC_API_URL=http://localhost:8080

# Run development server
npm run dev
# Frontend starts at http://localhost:3000

# Build for production
npm run build && npm start
```

### Running Both Together

```bash
# Terminal 1 - Backend
cd interview-platform-backend && ./mvnw spring-boot:run

# Terminal 2 - Frontend
cd interview-platform-frontend && npm run dev
```

### Running with HTTPS (Local SSL)

```bash
# Terminal 1 - Backend with SSL profile (HTTPS on port 8443)
cd interview-platform-backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev,ssl

# Terminal 2 - Frontend pointing to HTTPS backend
cd interview-platform-frontend
cp .env.ssl .env.local   # Sets NEXT_PUBLIC_API_URL=https://localhost:8443
NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev
```

> **Note:** The backend uses a self-signed certificate for local dev. Set `NODE_TLS_REJECT_UNAUTHORIZED=0` so Next.js rewrites accept it. For production, HTTPS is handled by Istio/reverse proxy.

---

## Frontend Features

### UX & Interactions (Zepto/Blinkit Style)
| Feature | Description |
|---------|-------------|
| Command Palette | `Cmd+K` / `Ctrl+K` to search & navigate anywhere |
| Progress Bar | Thin indigo bar at top during route transitions |
| Dark Mode | Toggle with system preference detection |
| Mobile Responsive | Hamburger menu + slide-in sidebar |
| Notification Dropdown | Bell icon with live unread count + popup |
| Breadcrumbs | Auto-generated from URL path |
| Animated Counters | Numbers roll up with easing on dashboard |
| Card Interactions | Hover lift, press scale, glow effects |
| Stagger Animations | Grid items animate in sequentially |
| Toast Notifications | Slide-in with icons, progress timer, stacking |
| Floating Action Button | Quick access on mobile |
| Skeleton Shimmer | Gradient loading placeholders |
| Keyboard Shortcuts | `g+d` Dashboard, `g+i` Interviews, etc. |

### Key Components
| Component | File | Description |
|-----------|------|-------------|
| Calendar Picker | `components/ui/calendar-picker.tsx` | Monthly calendar + time slot selector |
| Code Editor | `components/ui/code-editor.tsx` | Dark theme, syntax highlighting, line numbers |
| Command Palette | `components/ui/command-palette.tsx` | Full-text search across all pages |
| Progress Bar | `components/ui/progress-bar.tsx` | Route change loading indicator |
| Notification Dropdown | `components/ui/notification-dropdown.tsx` | Bell icon + popup |
| Breadcrumb | `components/ui/breadcrumb.tsx` | Auto-path breadcrumbs |
| Empty State | `components/ui/empty-state.tsx` | 6 SVG illustrations for no-data states |
| Dark Mode Toggle | `components/ui/dark-mode-toggle.tsx` | Sun/moon with localStorage persistence |
| Toast | `components/ui/toast.tsx` | Stacked notifications with progress bar |

---

## All Frontend Routes (96 pages)

### Main Application
| Route | Description |
|-------|-------------|
| `/` | Landing page with features & CTA |
| `/login` | Email/password + OAuth (Google, GitHub) + SSO (Okta/Keycloak) |
| `/register` | Self-registration |
| `/dashboard` | Role-based stats, quick actions, activity feed |
| `/profile` | User details, roles, permissions, change password |

### Interviews & Scheduling
| Route | Description |
|-------|-------------|
| `/interviews` | Interview list with filters, CRUD, status management |
| `/interviews/[id]` | Detail view: feedback, scoring, meeting link, AI suggestions |
| `/interviews/session` | Live session: code editor, video, chat, whiteboard |
| `/scheduling` | Availability grid, smart time slot finder |
| `/scheduling/self-service` | Candidate preferred time slot picker |

### Recruitment
| Route | Description |
|-------|-------------|
| `/jobs` | Job positions with card grid, status management |
| `/pipelines` | Kanban-style hiring pipeline with stage advancement |
| `/templates` | Interview templates with question linking |
| `/talent-pool` | Candidate relationship management for passive candidates |
| `/sources` | Source effectiveness tracking |
| `/tags` | Tags & labels management |

### Resources
| Route | Description |
|-------|-------------|
| `/questions` | Question bank with categories, difficulty, search |
| `/teams` | Team management with members and roles |
| `/documents` | File manager with drag & drop upload |
| `/scorecards` | Weighted evaluation scorecards |
| `/reminders` | Interview reminders configuration |

### Intelligence & AI
| Route | Description |
|-------|-------------|
| `/ai` | AI assistant: PDF resume upload, question suggestions, summaries (OpenRouter) |
| `/copilot` | Real-time AI interview coaching dashboard |
| `/transcription` | Live transcription session management |
| `/video-analysis` | Video sentiment/engagement analysis |
| `/reports` | Analytics with CSS charts, conversion funnel, PDF export |
| `/report-builder` | Custom report templates with saved filters |
| `/resume-ranking` | AI-powered candidate ranking by fit score |
| `/engagement-scoring` | Candidate engagement metrics dashboard |
| `/recording-highlights` | AI-generated key moments from recordings |
| `/activity` | Activity timeline with filters |
| `/notifications` | Real-time notification list |
| `/search` | Global search across all entities |
| `/workflows` | Configurable workflow engine |

### Settings
| Route | Description |
|-------|-------------|
| `/organizations` | Multi-tenant organization management |
| `/settings/mfa` | Two-factor auth: QR code, OTP input, backup codes |
| `/settings/security` | Password change, session management |
| `/settings/api-keys` | API key management with one-time reveal |
| `/settings/webhooks` | Webhook CRUD with delivery history |
| `/settings/gdpr` | Privacy consent, data export, erasure requests |
| `/settings/audit` | Audit log viewer with filters |
| `/settings/bulk` | Bulk schedule, invite, export operations |
| `/settings/export` | Data export/import job management |
| `/settings/billing` | Subscription plans, payment management |
| `/settings/sso` | SSO/SAML configuration |

### Admin Panel
| Route | Description |
|-------|-------------|
| `/admin` | Admin overview |
| `/admin/users` | User management |
| `/admin/roles` | Role management |
| `/admin/permissions` | Permission management |
| `/admin/role-permissions` | Role-permission mapping |

---

## Backend API Coverage (220+ Endpoints)

### Authentication & Security
| Endpoint Group | Count | Description |
|---------------|-------|-------------|
| `/api/v1/auth/*` | 10 | Register, login, password reset, email verify |
| `/api/v1/auth/mfa/*` | 5 | TOTP setup, verify, validate, disable, backup codes |
| `/api/v1/auth/oauth2/*` | 1 | OAuth2 provider listing |
| `/api/v1/api-keys` | 3 | API key create, list, revoke |

### Users & RBAC
| Endpoint Group | Count | Description |
|---------------|-------|-------------|
| `/api/v1/users/*` | 16 | CRUD, profile, roles, permissions, search, status |
| `/api/v1/roles/*` | 5 | Role CRUD |
| `/api/v1/roles/*/permissions` | 3 | Role-permission mapping |
| `/api/v1/permissions/*` | 5 | Permission CRUD |

### Interviews
| Endpoint Group | Count | Description |
|---------------|-------|-------------|
| `/api/v1/interviews/*` | 22 | Full lifecycle: CRUD, status, feedback, filtering |
| `/api/v1/interviews/*/meeting` | 2 | Meeting link generate/get |
| `/api/v1/interviews/*/code/*` | 5 | Code editor sessions |

### Scheduling & Calendar
| Endpoint Group | Count | Description |
|---------------|-------|-------------|
| `/api/v1/scheduling/*` | 5 | Availability, smart suggestions |
| `/api/v1/calendar/*` | 4 | Interviewer calendar management |
| `/api/v1/self-service/*` | 6 | Candidate preferred time slots |
| `/api/v1/reminders/*` | 4 | Interview reminders |

### Recruitment
| Endpoint Group | Count | Description |
|---------------|-------|-------------|
| `/api/v1/job-positions/*` | 12 | Job position CRUD + interview linking |
| `/api/v1/pipelines/*` | 14 | Hiring pipelines + candidate advancement |
| `/api/v1/templates/*` | 11 | Interview template CRUD + question linking |
| `/api/v1/questions/*` | 8 | Question bank + categories |
| `/api/v1/scorecards/*` | 13 | Evaluation criteria + scorecard submission |

### Collaboration
| Endpoint Group | Count | Description |
|---------------|-------|-------------|
| `/api/v1/whiteboards/*` | 8 | Whiteboard sessions + strokes |
| `/api/v1/video-recordings/*` | 7 | Video recording management |
| WebSocket (STOMP) | 6 | Real-time: join, chat, code, signal |

### Intelligence & Analytics
| Endpoint Group | Count | Description |
|---------------|-------|-------------|
| `/api/v1/ai/*` | 6 | Question suggestions, resume parsing, summaries |
| `/api/v1/reports/*` | 7 | Analytics, PDFs, conversion, time-to-hire |
| `/api/v1/dashboard/*` | 4 | Role-based dashboard stats |

### Data Management
| Endpoint Group | Count | Description |
|---------------|-------|-------------|
| `/api/v1/documents/*` | 10 | File upload/download/metadata |
| `/api/v1/bulk/*` | 3 | Bulk schedule, invite, export |
| `/api/v1/export-import/*` | 5 | Async export/import jobs |
| `/api/v1/notifications/*` | 5 | In-app notifications |

### Organizations & Teams
| Endpoint Group | Count | Description |
|---------------|-------|-------------|
| `/api/v1/organizations/*` | 9 | Multi-tenant management |
| `/api/v1/teams/*` | 10 | Team CRUD + members |
| `/api/v1/tags/*` | 9 | Tagging system |

### Compliance & Audit
| Endpoint Group | Count | Description |
|---------------|-------|-------------|
| `/api/v1/gdpr/*` | 7 | Consent, data export, erasure |
| `/api/v1/audit/*` | 3 | Audit log queries |
| `/api/v1/activities/*` | 5 | Activity feed |
| `/api/v1/webhooks/*` | 8 | Webhook integration |
| `/api/v1/candidate-feedback/*` | 4 | Candidate reverse feedback |

---

## Frontend Services (24 files)

| Service | File | Key Methods |
|---------|------|-------------|
| Auth | `auth.service.ts` | login, signup, googleLogin, refresh, logout |
| User | `user.service.ts` | getMe, getProfile, getUserRoles, getUserPermissions, changePassword |
| Interview | `interview.service.ts` | CRUD, feedback, status, filter by date/status |
| Dashboard | `dashboard.service.ts` | getMyStats (role-aware), admin/interviewer/candidate |
| Scheduling | `scheduling.service.ts` | availability, suggestTimeSlots, calendar |
| Notification | `notification.service.ts` | getAll, getUnread, markAsRead, count |
| Report | `report.service.ts` | analytics, PDF downloads, conversion, time-to-hire |
| Document | `document.service.ts` | upload, download, metadata |
| Scorecard | `scorecard.service.ts` | criteria CRUD, scorecard submission |
| Template | `template.service.ts` | CRUD, question linking, create interview |
| Question | `question.service.ts` | CRUD, categories, search |
| Team | `team.service.ts` | CRUD, members, roles |
| Pipeline | `pipeline.service.ts` | CRUD, advance, reject, status |
| Job Position | `job-position.service.ts` | CRUD, status, interview linking |
| AI | `ai.service.ts` | suggestQuestions, parseResume, parseResumeFile (PDF) |
| Organization | `organization.service.ts` | CRUD, members, roles |
| Webhook | `webhook.service.ts` | CRUD, deliveries, retry |
| Activity | `activity.service.ts` | feed, filter, by entity |
| Audit | `audit.service.ts` | logs by entity/user |
| GDPR | `gdpr.service.ts` | consent, export, erasure |
| MFA | `mfa.service.ts` | setup, verify, validate, disable, backup codes |
| API Key | `api-key.service.ts` | create, list, revoke |
| Role | `role.service.ts` | CRUD, assignPermission |
| Permission | `permission.service.ts` | CRUD |

---

## Project Structure

```
interview-platform-frontend/
├── src/
│   ├── app/
│   │   ├── (app)/                         # Main app layout (sidebar + header)
│   │   │   ├── layout.tsx                 # Sidebar, header, command palette, notifications
│   │   │   ├── dashboard/page.tsx         # Animated dashboard with role-based stats
│   │   │   ├── interviews/
│   │   │   │   ├── page.tsx               # Interview list with CRUD
│   │   │   │   ├── [id]/page.tsx          # Interview detail (feedback, scoring, AI)
│   │   │   │   └── session/page.tsx       # Live interview session (code, video, chat)
│   │   │   ├── scheduling/
│   │   │   │   ├── page.tsx               # Availability + smart scheduler
│   │   │   │   └── self-service/page.tsx  # Candidate time slot picker
│   │   │   ├── jobs/page.tsx              # Job positions
│   │   │   ├── pipelines/page.tsx         # Kanban hiring pipeline
│   │   │   ├── questions/page.tsx         # Question bank
│   │   │   ├── templates/page.tsx         # Interview templates
│   │   │   ├── teams/page.tsx             # Team management
│   │   │   ├── reports/page.tsx           # Analytics & charts
│   │   │   ├── ai/page.tsx               # AI assistant (PDF upload + text)
│   │   │   ├── notifications/page.tsx     # Notification list
│   │   │   ├── documents/page.tsx         # Document manager
│   │   │   ├── activity/page.tsx          # Activity timeline
│   │   │   ├── organizations/page.tsx     # Organization management
│   │   │   ├── profile/page.tsx           # User profile, roles, permissions
│   │   │   └── settings/
│   │   │       ├── mfa/page.tsx           # MFA setup (QR + OTP + backup codes)
│   │   │       ├── api-keys/page.tsx      # API key management
│   │   │       ├── webhooks/page.tsx      # Webhook CRUD
│   │   │       ├── gdpr/page.tsx          # Privacy & consent
│   │   │       ├── audit/page.tsx         # Audit logs
│   │   │       ├── bulk/page.tsx          # Bulk operations
│   │   │       └── export/page.tsx        # Export/Import jobs
│   │   ├── admin/                         # Admin panel (own layout)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── roles/page.tsx
│   │   │   ├── permissions/page.tsx
│   │   │   └── role-permissions/page.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── oauth2/                        # OAuth callback handlers
│   │   ├── page.tsx                       # Landing page
│   │   ├── layout.tsx                     # Root layout
│   │   ├── providers.tsx                  # Context providers
│   │   └── globals.css                    # Animations & dark mode
│   ├── components/ui/                     # Reusable UI components
│   │   ├── button.tsx                     # Animated buttons with variants
│   │   ├── card.tsx                       # Hover shadow transitions
│   │   ├── dialog.tsx                     # Modal with Trigger/Close
│   │   ├── select.tsx                     # Compound + native select
│   │   ├── table.tsx                      # Data table
│   │   ├── input.tsx                      # Focus ring animations
│   │   ├── badge.tsx                      # Scale on hover
│   │   ├── skeleton.tsx                   # Shimmer gradient loading
│   │   ├── toast.tsx                      # Stacked slide-in notifications
│   │   ├── calendar-picker.tsx            # Monthly calendar + time slots
│   │   ├── code-editor.tsx                # Dark theme code editor
│   │   ├── command-palette.tsx            # Cmd+K search/navigate
│   │   ├── progress-bar.tsx              # Top loading bar
│   │   ├── notification-dropdown.tsx      # Bell icon + popup
│   │   ├── breadcrumb.tsx                 # Auto-path breadcrumbs
│   │   ├── empty-state.tsx                # SVG illustrations
│   │   ├── dark-mode-toggle.tsx           # Theme switcher
│   │   └── ...
│   ├── services/                          # 24 API service files
│   ├── hooks/
│   │   └── use-action-feedback.ts         # Toast wrapper for CRUD operations
│   ├── store/
│   │   └── auth.store.ts                  # Zustand auth state
│   ├── lib/
│   │   ├── api-endpoints.ts              # All 220+ endpoint mappings
│   │   ├── axios.ts                      # Axios instance (baseURL: localhost:8080)
│   │   ├── axios-inteceptor.ts           # JWT auto-attach + refresh on 401
│   │   └── utils.ts                      # Utilities
│   └── types/
│       ├── index.ts                      # All domain types (50+ interfaces)
│       └── auth.ts                       # Auth-specific types
├── .env.local                            # NEXT_PUBLIC_API_URL=http://localhost:8080
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `g` then `d` | Go to Dashboard |
| `g` then `i` | Go to Interviews |
| `g` then `j` | Go to Jobs |
| `g` then `q` | Go to Questions |
| `g` then `t` | Go to Teams |
| `g` then `r` | Go to Reports |
| `g` then `n` | Go to Notifications |
| `g` then `s` | Go to Scheduling |
| `Esc` | Close dialogs/modals |

---

## Key Flows

### Interview Lifecycle
```
Schedule Interview -> Generate Meeting Link -> Conduct Session
     │                                              │
     ├── Add Interviewers                          ├── Code Editor
     ├── Set Reminders                             ├── Whiteboard
     └── AI Suggest Questions                      ├── Video/Chat
                                                    └── Notes
                                                         │
                                              Submit Feedback + Scorecard
                                                         │
                                              AI Generate Summary
                                                         │
                                              Pipeline: Advance/Reject
```

### Authentication Flow
```
Register/Login -> JWT Access Token + Refresh Token
      │
      ├── OAuth2 (Google/GitHub/Microsoft)
      ├── SSO - Okta OIDC (Primary) -> auto-fallback to Keycloak OIDC
      ├── SAML 2.0 (OneLogin/AzureAD/Generic - legacy enterprise)
      ├── Email Verification
      ├── MFA Setup (TOTP + Backup Codes)
      └── Password Reset via Email
```

### Candidate Self-Service
```
Candidate views Job Position -> Submits Preferred Time Slots
                                       │
                              Recruiter Reviews Slots
                                       │
                              Auto-Schedule with Smart Matching
                                       │
                              Interview Confirmed + Reminders Sent
```

---

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### Backend (.env)
```env
# Database
DB_URL=jdbc:postgresql://localhost:5432/interview_platform
DB_USERNAME=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-256-bit-secret
JWT_EXPIRATION=86400000

# OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Okta OIDC (Primary SSO)
OKTA_CLIENT_ID=0oaxxxxxxxxx
OKTA_CLIENT_SECRET=okta-client-secret
OKTA_ISSUER_URI=https://dev-xxxxxxxx.okta.com/oauth2/default

# Keycloak OIDC (Fallback SSO - self-hosted via Docker)
KEYCLOAK_CLIENT_ID=interview-platform
KEYCLOAK_CLIENT_SECRET=interview-platform-secret
KEYCLOAK_ISSUER_URI=http://localhost:9090/realms/interview-platform

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3000

# Services
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_ENABLED=false
AWS_S3_ENDPOINT=http://localhost:4566
```

---

## Development

```bash
# Frontend dev (hot reload)
cd interview-platform-frontend && npm run dev

# Backend dev
cd interview-platform-backend && ./mvnw spring-boot:run

# Build frontend
cd interview-platform-frontend && npm run build

# Run backend tests
cd interview-platform-backend && ./mvnw test
```

---

## License

Private - All rights reserved.

---

## New Features (Latest Release)

### Candidate Portal & Job Board (`/careers`)
- Public-facing job listings with search and filters (Department, Location, Type, Experience)
- Job detail modal with full description, requirements, skills, salary
- Application submission form (resume upload, cover letter, LinkedIn)
- "My Applications" tab with status tracking and timeline visualization
- Status pipeline: Applied -> Screening -> Interview -> Offered -> Hired/Rejected

### Offer Letter Management (`/offers`)
- Create offers with compensation breakdown (base + bonus + equity + benefits)
- Approval workflow chain visualization
- Status tracking: DRAFT -> PENDING_APPROVAL -> SENT -> ACCEPTED/DECLINED/EXPIRED
- E-signature integration placeholder (DocuSign/HelloSign ready)
- Actions: Send, Revoke, Extend deadline

### Calendar Sync (`/calendar-sync`)
- Google Calendar & Outlook Calendar integration cards
- Connect/Disconnect with OAuth flow
- Sync frequency configuration (5min / 15min / 30min / 1hr)
- Recent sync history with status
- Auto-create events, send invites, block availability toggles

### Workflow Automation Engine (`/workflows`)
- Visual rule builder: Trigger + Conditions + Action
- Triggers: Interview Completed, Score Submitted, Candidate Applied, Stage Changed
- Conditions: avg_score >, recommendation ==, stage contains
- Actions: Advance stage, Send notification, Assign interviewer, Reject, Create offer
- Pre-built template rules
- Execution log showing when rules fired

### Approval Center (`/approvals`)
- Pending approvals queue with urgency badges
- Tabs: My Pending, My Requests, All (Admin)
- Approval chain visualization (ordered approvers with status)
- Create approval requests with attachments
- Approve/Reject with comments
- History of completed approvals

### Employee Referral Program (`/referrals`)
- Stats dashboard: Total Referrals, Hired, Pending, Bonus Earned
- "Refer a Candidate" form
- Referral status tracking with pipeline visualization
- Employee leaderboard (top referrers by hires)
- Admin settings: Bonus amounts, eligible positions

### DEI/Diversity Analytics (`/dei-analytics`)
- Privacy-first approach (opt-in, anonymized)
- Funnel analysis by demographic groups (Applied -> Hired)
- Gender distribution and ethnicity breakdown (CSS bar charts)
- Monthly diversity trend tracking
- AI-generated recommendations for improving diversity
- Export to PDF/CSV

### Source Effectiveness (`/sources`)
- Track all candidate sources (Job Board, Referral, Social, Agency, Direct)
- Per-source metrics: Candidates, Interviews, Hires, Conversion %, Cost/Hire, ROI
- Visual comparison with horizontal bar charts
- Source detail with monthly trends
- Ranked leaderboard with medal badges

### ATS Integration Connectors (`/integrations`)
- 12 pre-built integrations: Greenhouse, Lever, Workday, Slack, Teams, Google Calendar, Outlook, LinkedIn, Indeed, DocuSign, Zoom, GitHub
- Connection management (connect/disconnect/test)
- Configuration fields per integration (API keys, webhook URLs)
- Sync status monitoring with last-synced timestamp
- Data mapping options

### In-App Messaging (`/messaging`)
- 3-panel Slack/Discord-style chat UI
- Conversation types: Direct, Group, Interview-specific
- Message bubbles (sent/received), timestamps, read receipts
- Contact details panel with shared files
- New message compose with recipient autocomplete
- Typing indicator and unread badges

### Structured Interview Kits (`/interview-kits`)
- Pre-built kits with sections (Opening, Technical, Behavioral, Closing)
- Per-question scoring rubric (1-5 scale with descriptions)
- Time allocation per question
- Expandable expected answers
- "Download PDF" for offline use
- "Use in Interview" to attach kit to a scheduled interview
- Kit builder with section/question management

---

## Complete Route Map (51 pages)

| # | Route | Category | Description |
|---|-------|----------|-------------|
| 1 | `/` | Public | Landing page |
| 2 | `/login` | Auth | Email/password + OAuth |
| 3 | `/register` | Auth | Self-registration |
| 4 | `/dashboard` | Main | Role-based stats & quick actions |
| 5 | `/profile` | Main | User details, roles, permissions |
| 6 | `/interviews` | Interviews | List with CRUD & filters |
| 7 | `/interviews/[id]` | Interviews | Detail: feedback, scoring, meeting, AI |
| 8 | `/interviews/session` | Interviews | Live session: code, video, chat |
| 9 | `/scheduling` | Scheduling | Availability & smart scheduler |
| 10 | `/scheduling/self-service` | Scheduling | Candidate time slot picker |
| 11 | `/messaging` | Communication | In-app chat (Slack-style) |
| 12 | `/jobs` | Recruitment | Job positions management |
| 13 | `/careers` | Recruitment | Public job board & applications |
| 14 | `/pipelines` | Recruitment | Kanban hiring pipeline |
| 15 | `/offers` | Recruitment | Offer letter management |
| 16 | `/referrals` | Recruitment | Employee referral program |
| 17 | `/questions` | Resources | Question bank with categories |
| 18 | `/interview-kits` | Resources | Structured interview guides |
| 19 | `/code-editor` | Resources | Code editor with runtime |
| 20 | `/templates` | Resources | Interview templates |
| 21 | `/teams` | Resources | Team management |
| 22 | `/documents` | Resources | File manager with upload |
| 23 | `/ai` | Intelligence | AI assistant (PDF + text) |
| 24 | `/reports` | Intelligence | Analytics & charts |
| 25 | `/dei-analytics` | Intelligence | Diversity analytics |
| 26 | `/sources` | Intelligence | Source effectiveness |
| 27 | `/activity` | Intelligence | Activity timeline |
| 28 | `/workflows` | Automation | Rule-based automation |
| 29 | `/approvals` | Automation | Approval workflows |
| 30 | `/calendar-sync` | Automation | Calendar integration |
| 31 | `/integrations` | Automation | ATS connectors |
| 32 | `/notifications` | System | Notification center |
| 33 | `/organizations` | Settings | Multi-tenant orgs |
| 34 | `/settings/mfa` | Settings | Two-factor auth |
| 35 | `/settings/api-keys` | Settings | API key management |
| 36 | `/settings/webhooks` | Settings | Webhook CRUD |
| 37 | `/settings/gdpr` | Settings | Privacy & consent |
| 38 | `/settings/audit` | Settings | Audit logs |
| 39 | `/settings/bulk` | Settings | Bulk operations |
| 40 | `/settings/export` | Settings | Export/Import jobs |
| 41 | `/analytics` | Intelligence | Cohort analysis, retention, real-time metrics |
| 42 | `/leaderboard` | Intelligence | Interviewer performance rankings |
| 43 | `/careers` | Recruitment | Public job board + applications |
| 44 | `/offers` | Recruitment | Offer letter management |
| 45 | `/referrals` | Recruitment | Employee referral program |
| 46 | `/workflows` | Automation | Rule-based automation engine |
| 47 | `/approvals` | Automation | Approval workflows |
| 48 | `/calendar-sync` | Automation | Google/Outlook calendar sync |
| 49 | `/integrations` | Automation | ATS integration connectors |
| 50 | `/messaging` | Communication | In-app Slack-style chat |
| 51 | `/interview-kits` | Resources | Structured interview guides |
| 52 | `/dei-analytics` | Intelligence | Diversity & inclusion analytics |
| 53 | `/sources` | Intelligence | Candidate source tracking & ROI |
| 54-58 | `/admin/*` | Admin | Users, roles, permissions |
| 59-61 | `/oauth2/*` | Auth | OAuth callback handlers |

---

## DevOps & Infrastructure

### CI/CD Pipeline (GitHub Actions)
```
.github/workflows/ci.yml
├── backend-test    (Maven + PostgreSQL + Redis)
├── frontend-build  (npm ci + next build + lint)
└── docker-build    (multi-stage Docker images on main)
```

### Docker
| File | Purpose |
|------|---------|
| `interview-platform-backend/Dockerfile` | Multi-stage JDK 21 build -> JRE 21 runtime |
| `interview-platform-frontend/Dockerfile` | Multi-stage Node 18 build -> standalone runtime |
| `interview-platform-backend/docker-compose.yml` | PostgreSQL + Redis + Kafka + LocalStack + Keycloak + Vault + OTel (dev) |
| `monitoring/docker-compose.monitoring.yml` | Prometheus + Grafana + Node Exporter |

### Kubernetes
```
k8s/deployment.yml
├── Namespace: interview-platform
├── Backend:   2 replicas, health probes, secrets, resource limits
├── Frontend:  2 replicas, env config
├── Redis:     1 replica
├── Services:  ClusterIP (internal) + LoadBalancer (frontend)
└── Ingress:   /api -> backend, / -> frontend
```

### Monitoring
| Service | Port | URL |
|---------|------|-----|
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3001 | http://localhost:3001 (admin/admin) |
| Node Exporter | 9100 | Metrics at /metrics |
| Backend Metrics | 8080 | /actuator/prometheus |

### Quick Start Commands
```bash
# Start all infrastructure (dev)
cd interview-platform-backend && docker compose up -d

# Start monitoring stack
cd monitoring && docker compose -f docker-compose.monitoring.yml up -d

# Run backend
cd interview-platform-backend && ./mvnw spring-boot:run

# Run frontend
cd interview-platform-frontend && npm run dev

# Build Docker images
docker build -t interview-backend ./interview-platform-backend
docker build -t interview-frontend ./interview-platform-frontend

# Deploy to Kubernetes
kubectl apply -f k8s/deployment.yml
```

---

## Backend API Additions (Latest)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/search?q=&type=&page=&size=` | GET | Full-text search across all entities |
| `/api/v1/analytics/cohorts?months=6` | GET | Cohort analysis by registration month |
| `/api/v1/analytics/leaderboard?limit=10` | GET | Interviewer performance leaderboard |
| `/api/v1/analytics/realtime` | GET | Live metrics (active interviews, etc.) |
| `/api/v1/analytics/retention` | GET | Week-over-week retention rates |
| `/api/v1/code/execute` | POST | Execute code via Piston API |
| `/api/v1/code/execute/test-cases` | POST | Run code against test cases |
| `/api/v1/interviews/{id}/presence` | GET | WebSocket presence (who's connected) |

---

## Tech Integrations

| Integration | Status | How It Works |
|-------------|--------|-------------|
| OpenAI GPT-4o-mini | Active (if API key set) | Question generation, resume parsing, interview summaries |
| Piston API | Active | Server-side code execution (Python, Java, C++, Go, Rust, JS, TS) |
| Twilio | Active (if credentials set) | SMS interview reminders via REST API |
| Daily.co | Active (if room URL set) | WebRTC video calls via iframe embed |
| Zoom | Active (if OAuth configured) | Server-to-Server OAuth meeting creation |
| LocalStack | Active (Docker) | S3 file storage emulation for dev |
| PostgreSQL FTS | Active | Full-text search via tsvector/tsquery |
| Redis | Active | Rate limiting, caching, session store |
| Kafka | Optional | Event streaming (when enabled) |
| Prometheus | Optional | Metrics collection at /actuator/prometheus |
| Grafana | Optional | Visualization dashboards |

---

## Final Platform Stats

| Metric | Count |
|--------|-------|
| Frontend Pages | 96 |
| Backend REST Endpoints | 550+ |
| Backend Controllers | 120 |
| Frontend Service Files | 70 |
| UI Components | 20+ |
| Database Entities | 134 |
| Flyway Migrations | 43 |
| Test Files | 67 |
| DevOps Files | 15 |
| Docker Compose Files | 3 |

---

## License

Private - All rights reserved.
