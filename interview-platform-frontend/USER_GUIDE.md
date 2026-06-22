# Interview Platform - User Guide

## Overview

The Interview Platform is a comprehensive hiring management solution that helps organizations streamline their entire interview process - from job posting to offer letters. It supports multiple user roles with tailored experiences for Administrators, Recruiters, Interviewers, and Candidates.

---

## Getting Started

### Accessing the Platform
- **URL**: `http://localhost:3000` (development) or your deployed domain
- **Supported Browsers**: Chrome, Firefox, Safari, Edge (latest versions)

### Creating an Account
1. Navigate to the login page
2. Click **"Sign Up"** to create a new account
3. Fill in your details (name, email, password)
4. Verify your email via the link sent to your inbox
5. Log in with your credentials

### Login Options
- **Email/Password**: Standard login with email and password
- **Google**: One-click login via Google account
- **GitHub**: Login via GitHub account
- **SSO/SAML**: Enterprise single sign-on (if configured by your organization)

### Multi-Factor Authentication (MFA)
- Navigate to **Settings > Security (MFA)** to enable
- Scan the QR code with Google Authenticator or similar app
- Save your backup codes in a secure location
- MFA will be required on every subsequent login

---

## User Roles

| Role | Access Level |
|------|-------------|
| **Admin** | Full system access, user management, settings |
| **Recruiter** | Job management, scheduling, pipelines, offers |
| **Interviewer** | Conduct interviews, submit feedback, view schedules |
| **Candidate** | View interviews, submit self-service slots, apply to jobs |

---

## Core Features

### Dashboard
The dashboard provides role-specific overview:
- **Admin/Recruiter**: Total interviews, candidates, hire rates, activity feed
- **Interviewer**: Upcoming interviews, feedback pending, performance stats
- **Candidate**: Scheduled interviews, application status, offer status

### Interview Management

#### Creating an Interview
1. Go to **Interviews** > Click **"+ New Interview"**
2. Fill in: Title, Type, Candidate, Date/Time, Duration
3. Assign interviewers
4. Save to create

#### Interview Types
- Technical, Behavioral, System Design, Coding, HR, Case Study

#### Interview Session (Live)
- **Code Editor**: Collaborative coding with syntax highlighting (7 languages)
- **Whiteboard**: Shared drawing canvas for diagrams
- **Video Call**: Built-in video conferencing
- **Chat**: Real-time text messaging

#### Submitting Feedback
After an interview, interviewers can:
1. Go to the interview detail page
2. Click "Submit Feedback"
3. Rate the candidate (1-5 stars)
4. Select recommendation (Strong Hire, Hire, No Hire, Strong No Hire)
5. Add strengths, weaknesses, and notes

---

### Scheduling

#### Setting Availability (Interviewers)
1. Go to **Scheduling**
2. Add your available time slots (recurring or specific dates)
3. System uses this data for smart scheduling

#### Smart Suggestions
- The system auto-suggests optimal time slots based on:
  - Interviewer availability
  - Candidate preferences
  - Meeting room/resource availability
  - Time zone alignment

#### Calendar Sync
- Connect Google Calendar or Outlook
- Interviews auto-sync bidirectionally
- Navigate to **Calendar Sync** in the Automation section

#### Self-Service (Candidates)
- Candidates can submit preferred time slots
- Go to **Scheduling > Self-Service**
- Select available windows when you can interview

---

### Recruitment Pipeline

#### Job Positions
- Create and manage job openings
- Track status: Draft, Open, Closed, On Hold
- Link interviews to specific positions

#### Careers Portal
- Public-facing job board for candidates
- Candidates can browse and apply directly
- Applications tracked automatically

#### Pipelines
- Create multi-stage hiring pipelines
- Stages: Application Review, Phone Screen, Technical, Final, Offer
- Track candidates through each stage
- Advance or reject at any stage

#### Offer Letters
- Generate offers linked to job positions
- Multi-step approval workflow
- E-signature integration (DocuSign, HelloSign)
- Track: Draft, Pending Approval, Sent, Viewed, Accepted, Declined

---

### Question Bank & Templates

#### Question Bank
- Organize questions by category and difficulty
- Search across your entire question library
- Share questions across interview templates

#### Interview Templates
- Pre-configure interview structures
- Assign questions with time allocations
- Create interviews from templates with one click

#### Scorecards
- Define evaluation criteria per interview type
- Weighted scoring across multiple dimensions
- Standardized assessment across interviewers

---

### AI Features

#### AI Assistant (`/ai`)
- Generate tailored interview questions based on role/skills
- Parse resumes to extract structured candidate data
- Generate interview summaries from feedback data

#### AI Chatbot (`/chatbot`)
- Conversational interface for quick AI tasks
- Natural language question generation
- Resume parsing via text input
- Interview summary generation

---

### Communication

#### Messaging
- Slack-style internal messaging
- Direct messages and channels
- Thread-based conversations

#### Notifications
- Real-time in-app notifications (bell icon)
- Email notifications for important events
- Configure notification preferences

#### Reminders
- Automatic interview reminders at 24h, 1h, 15min
- Configurable per interview

---

### Reports & Analytics

#### Reports
- Overall hiring analytics
- Interviewer performance reports
- PDF export capability
- Conversion funnel metrics
- Time-to-hire tracking

#### DEI Analytics
- Diversity pipeline tracking (opt-in)
- Funnel analysis by demographics
- Compliance reporting

#### Source Tracking
- Track where candidates come from
- Measure source effectiveness and ROI
- Compare referrals vs. job boards vs. direct

---

### Automation

#### Workflows
- Create rule-based automations
- Triggers: Interview completed, Status changed, Application received
- Actions: Send email, Update status, Notify team, Create task
- Test rules before enabling

#### Approvals
- Configure approval chains for offers, requisitions
- Multi-step approval with sequential/parallel modes
- Track approval status in real-time

---

### Teams & Organizations

#### Teams
- Group interviewers by department/function
- Assign team roles (Lead, Member)
- Team-based interview distribution

#### Organizations
- Multi-tenant support
- Invite members, assign roles
- Organization-level settings

---

### Settings

#### SSO/SAML Configuration (`/settings/sso`)
- Add SAML 2.0 identity providers (Okta, OneLogin, Azure AD)
- Configure Entity ID, Metadata URL, X.509 Certificate
- Enable/disable providers
- Test SSO login before going live

#### Account Security (`/settings/security`)
- **Account Lockout**: Check lockout status, unlock accounts
- **IP Blocking**: Block/unblock suspicious IPs with reasons
- **Login Attempts**: View login history and failed attempts

#### API Keys (`/settings/api-keys`)
- Generate API keys for system integrations
- Name and manage multiple keys
- Revoke keys when no longer needed

#### Webhooks (`/settings/webhooks`)
- Configure webhook endpoints for event notifications
- Select events to subscribe to
- View delivery history and retry failed deliveries

#### GDPR/Privacy (`/settings/gdpr`)
- Manage user consent records
- Export personal data (right of access)
- Submit data erasure requests (right to be forgotten)

#### Audit Logs (`/settings/audit`)
- View complete audit trail
- Filter by entity type, user, date range
- Track all system changes

#### Bulk Operations (`/settings/bulk`)
- Bulk schedule interviews
- Bulk invite candidates
- Bulk export data (CSV/JSON)

#### Export/Import (`/settings/export`)
- Start async export jobs
- Import data from CSV/JSON files
- Track job progress and download results

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `G then D` | Go to Dashboard |
| `G then I` | Go to Interviews |
| `G then J` | Go to Jobs |
| `G then S` | Go to Scheduling |
| `?` | Show shortcut help |

---

## Dark Mode

Toggle dark mode via the sun/moon icon in the top navigation bar. Your preference is saved locally and persists across sessions.

---

## New Features (Recently Added)

### In-App Messaging
Real-time messaging between recruiters, interviewers, and candidates.
- Create direct or group conversations
- Send text messages with threaded replies
- Real-time delivery via WebSocket
- Mark conversations as read
- Navigate to: `/messaging`

### Predictive Analytics
AI-powered predictions to improve hiring decisions.
- **Candidate Success Prediction**: Probability score based on interview performance
- **Interviewer Bias Detection**: Identifies systematic scoring patterns
- **Time-to-Hire Forecasting**: Predicts hiring timeline by department/level
- Navigate to: `/analytics` or use via API

### Recruiter SLA Tracking
Monitor and enforce recruiter performance standards.
- Response time SLA monitoring (configurable hours)
- Workload distribution across team
- Pipeline bottleneck identification
- Automated breach alerts
- Navigate to: `/reports` (SLA section)

### Background Checks
Automated post-offer background verification.
- Checkr and Sterling provider support
- Initiate checks directly from offer management
- Real-time status polling
- Navigate to: Triggered from `/offers` page

### ATS Integration
Bidirectional sync with your existing Applicant Tracking System.
- **Greenhouse**: Import/export candidates
- **Lever**: Sync opportunities
- **Workday**: Pull job applications
- Navigate to: `/integrations`

### Job Board Auto-Posting
Distribute job listings to multiple boards simultaneously.
- LinkedIn Jobs, Indeed, Glassdoor
- Single-click multi-board posting
- Track posting status per board
- Navigate to: `/jobs` (post action)

### Feature Flags
Control feature rollouts for your organization.
- Enable/disable features per environment
- Supports LaunchDarkly, Flagsmith, or local flags
- Admin-only toggle access
- Navigate to: Admin panel

### Assessment Marketplace
Browse and order third-party skill assessments.
- HackerRank, Codility, TestGorilla, Pluralsight integrations
- Order assessments for candidates
- View results and scores
- Navigate to: `/interview-kits` (assessments tab)

### Code Plagiarism Detection
Detect code similarity in take-home assessments.
- N-gram fingerprinting + Jaccard similarity
- Configurable threshold (85% default)
- Compare any two submissions
- Navigate to: Code review in interview session

### Native WebRTC Video
Built-in video calling without Zoom/Meet dependency.
- Browser-based peer-to-peer video
- STUN/TURN server support
- Room-based session management
- Navigate to: Interview session (`/interviews/session`)

### AI Interview Scoring
Automated transcript analysis with scoring.
- Communication clarity score
- Technical accuracy score
- Problem-solving assessment
- Overall recommendation
- Requires: OpenAI API key configured

### Data Residency (GDPR)
Multi-region data compliance.
- EU data stays in EU regions
- Cross-border transfer validation
- Compliance reporting per organization
- Navigate to: `/settings/gdpr`

### IP Whitelisting
Organization-level access restrictions.
- CIDR subnet support (e.g., 192.168.1.0/24)
- Per-organization whitelist management
- Admin-only configuration
- Navigate to: `/organizations` (settings)

---

## Troubleshooting

### Can't Login
- Check that your email is verified (check spam folder)
- If MFA is enabled, ensure your authenticator app clock is synced
- Contact admin if account is locked

### Interview Session Issues
- Ensure browser has camera/microphone permissions
- Check that WebSocket connections are not blocked by firewall
- Try a different browser if video/audio issues persist

### Data Not Loading
- Check your internet connection
- Try refreshing the page
- Clear browser cache if issues persist
- Check if the backend service is running

### Permission Denied
- Your user role may not have access to the requested feature
- Contact your organization admin for role adjustments

---

## Support

For issues or feature requests:
- Contact your system administrator
- Check the audit logs for error details
- Review the technical documentation for API-level troubleshooting
