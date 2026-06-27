# Services & Credentials Guide

A practical "how to get everything working" reference for the Interview Platform Backend.

---

## 1. Service Inventory Table

| Service | Purpose | Required? | Free Tier? | Credentials Needed |
|---------|---------|-----------|------------|-------------------|
| PostgreSQL | Primary database | Yes | Self-hosted (Docker) | Username/password (local defaults) |
| Redis | Caching, session store, rate limiting | Yes | Self-hosted (Docker) | None (no auth in dev) |
| Apache Kafka | Async event streaming, notifications | Yes | Self-hosted (Docker) | None (no auth in dev) |
| LocalStack (S3) | File/document storage | Yes | Self-hosted (Docker) | Fake AWS keys (`test`/`test`) |
| HashiCorp Vault | Secret management | No (dev) / Yes (prod) | Self-hosted (Docker) | Dev root token |
| OTel Collector | Telemetry pipeline | No | Self-hosted (Docker) | None |
| Jaeger | Distributed tracing UI | No | Self-hosted (Docker) | None |
| Google OAuth2 | Social login | No | Yes (free) | Client ID + Client Secret |
| GitHub OAuth2 | Social login | No | Yes (free) | Client ID + Client Secret |
| Microsoft OAuth2 | Social login | No | Yes (free) | Client ID + Client Secret |
| Gmail SMTP | Email notifications | No | Yes (app password) | Email + App Password |
| Twilio | SMS notifications | No | Yes (trial) | Account SID + Auth Token + Phone Number |
| Slack | Webhook notifications | No | Yes (free) | Webhook URL |
| Microsoft Teams | Webhook notifications | No | Yes (free) | Webhook URL |
| Zoom | Video meeting links | No | Yes (free tier) | Account ID + Client ID + Client Secret (Server-to-Server OAuth) |
| Google Meet | Video meeting links | No | Yes (reuses OAuth2) | Google OAuth2 credentials |
| **Okta (OIDC)** | **Primary SSO via OpenID Connect** | **No** | **Yes (developer)** | **Client ID + Client Secret + Issuer URI** |
| **Keycloak** | **Fallback SSO via OpenID Connect** | **No** | **Self-hosted (Docker)** | **Admin creds + Client ID + Secret** |
| DocuSign | E-signatures on offer letters | No | Yes (sandbox) | Integration Key + Account ID |
| HelloSign (Dropbox Sign) | E-signatures on offer letters | No | Yes (test mode) | API Key |
| Google Calendar API | Calendar sync | No | Yes (reuses OAuth2) | Google OAuth2 credentials |
| Microsoft Graph API | Outlook calendar sync | No | Yes (reuses OAuth2) | Microsoft OAuth2 credentials |
| SonarCloud | Static code analysis | No | Yes (open source) | Token |
| OWASP Dependency-Check | Vulnerability scanning | No | Yes (free/public NVD) | None |
| Docker | Code execution engine | Yes | Yes (free) | Docker socket access |
| **OpenAI** | **13 AI services (Coach, Matching, Screening, etc.)** | **No** | **$5 credit** | **API Key** |
| **Razorpay** | **Indian payment gateway (UPI, Cards, NetBanking)** | **No** | **Yes (test mode)** | **Key ID + Key Secret** |
| **PayU** | **Indian payment gateway (UPI, BNPL)** | **No** | **Yes (test mode)** | **Merchant Key + Salt** |
| **Cashfree** | **Indian payment gateway (UPI, PayLater)** | **No** | **Yes (test mode)** | **App ID + Secret Key** |
| **PhonePe** | **Indian payment gateway (UPI)** | **No** | **Yes (sandbox)** | **Merchant ID + Salt Key** |
| **Stripe** | **International payments (Cards, SEPA)** | **No** | **Yes (test mode)** | **Secret Key + Webhook Secret** |
| **Firebase** | **Push notifications (Android/iOS)** | **No** | **Yes (free tier)** | **Service account JSON** |
| **Checkr** | **Background checks (post-offer)** | **No** | **Yes (sandbox)** | **API Key** |
| **Sterling** | **Background checks (alternative)** | **No** | **No** | **API Key** |
| **Greenhouse** | **ATS bidirectional sync** | **No** | **No** | **API Key (Harvest)** |
| **Lever** | **ATS bidirectional sync** | **No** | **No** | **API Key** |
| **Workday** | **ATS bidirectional sync** | **No** | **No** | **Tenant URL + Client ID** |
| **LinkedIn** | **Job board posting** | **No** | **No** | **Access Token** |
| **Indeed** | **Job board posting** | **No** | **Yes (free tier)** | **Employer ID + API Key** |
| **Glassdoor** | **Job board posting** | **No** | **No** | **API Key** |
| **LaunchDarkly** | **Feature flags (cloud)** | **No** | **Yes (free tier)** | **SDK Key** |
| **Flagsmith** | **Feature flags (alternative)** | **No** | **Yes (free tier)** | **API Key** |
| **ClamAV** | **Virus scanning on file uploads** | **No** | **Self-hosted (Docker)** | **Host + Port (3310)** |
| **GitHub (PAT)** | **Candidate sourcing (search developers)** | **No** | **Yes (free)** | **Personal Access Token** |

---

## 1.5 New Services Added (Phase 9-14)

### AI Intelligence Services (13 total — all use OpenAI)

| Service | Package | What It Does | Credential |
|---------|---------|-------------|------------|
| AI Interview Coach | `aicoach/` | Real-time follow-ups, bias alerts, time management | `OPENAI_API_KEY` |
| Smart Talent Matching | `talentmatch/` | Score candidates against job requirements | `OPENAI_API_KEY` (optional) |
| Automated Screening Bot | `screeningbot/` | Async text-based initial screens with AI grading | `OPENAI_API_KEY` |
| Question Generator v2 | `ai/service/` | Context-aware questions from resume + JD + feedback | `OPENAI_API_KEY` |
| Sentiment Analysis | `sentiment/` | Engagement/confidence detection from text | Pattern-based (no API needed) |
| Compensation Intelligence | `compensation/` | Salary recommendations by level/region | Internal data only |
| Attrition Risk Prediction | `predictive/` | 6-month leaving probability with mitigations | Internal data only |
| Difficulty Calibration | `ai/service/` | Adaptive questioning (like GRE/GMAT) | Internal logic only |
| AI Suggestions | `ai/service/` | Question/resume/summary generation | `OPENAI_API_KEY` |
| AI Scoring | `aiscoring/` | Transcript analysis (communication/technical/problem-solving) | `OPENAI_API_KEY` |
| Predictive Analytics | `predictive/` | Candidate success, interviewer bias, time-to-hire | Internal data |
| AI Scheduling | `aischeduling/` | ML optimal time prediction (no-show + rating patterns) | Internal data |
| Candidate Sourcing | `sourcing/` | GitHub API search + AI skill extraction | `GITHUB_TOKEN` + `OPENAI_API_KEY` |

### Payment Gateways (5 total)

| Gateway | Package | Region | Config Properties |
|---------|---------|--------|-------------------|
| Stripe | `billing/` | International | `app.billing.stripe.secret-key` |
| Razorpay | `billing/gateway/` | India | `app.billing.razorpay.key-id`, `app.billing.razorpay.key-secret` |
| PayU | `billing/gateway/` | India | `app.billing.payu.merchant-key`, `app.billing.payu.merchant-salt` |
| Cashfree | `billing/gateway/` | India | `app.billing.cashfree.app-id`, `app.billing.cashfree.secret-key` |
| PhonePe | `billing/gateway/` | India | `app.billing.phonepe.merchant-id`, `app.billing.phonepe.salt-key` |

### Innovation Services (4 total)

| Service | Package | What It Does |
|---------|---------|-------------|
| CRDT Collaborative Editing | `crdt/` | Conflict-free concurrent document editing via WebSocket |
| Interview Replay | `replay/` | Full session playback with timeline scrubbing (code + whiteboard + feedback) |
| AI-Powered Scheduling | `aischeduling/` | ML predictions for optimal interview times |
| Candidate Sourcing AI | `sourcing/` | GitHub developer search + AI skill extraction + ranking |

---

## 2. Infrastructure Services (Self-Hosted via Docker)

All infrastructure runs locally via `docker compose up`. No external signups needed.

### PostgreSQL 16

**What it does:** Primary relational database for all application data.

**Default local credentials:**
```
Host: localhost
Port: 5433 (mapped from container 5432)
Database: interview_platform
Username: admin
Password: postgres
```

**Health check:**
```bash
# From host
pg_isready -h localhost -p 5433 -U admin -d interview_platform

# Or connect directly
psql -h localhost -p 5433 -U admin -d interview_platform -c "SELECT 1;"

# Via Docker
docker compose exec postgres pg_isready -U admin -d interview_platform
```

---

### Redis 7

**What it does:** Caching layer, distributed rate limiting, session store, and pub/sub for real-time features.

**Default local credentials:**
```
Host: localhost
Port: 6379
Password: (none - no auth in dev)
Max Memory: 128mb (LRU eviction)
```

**Health check:**
```bash
# From host (requires redis-cli)
redis-cli ping
# Expected: PONG

# Via Docker
docker compose exec redis redis-cli ping

# Check info
redis-cli info server | head -5
```

---

### Apache Kafka (Confluent 7.6)

**What it does:** Event-driven messaging for async notifications, audit events, and inter-service communication.

**Default local credentials:**
```
Bootstrap Servers: localhost:9092
Security Protocol: PLAINTEXT (no auth in dev)
Zookeeper: localhost:2181
Auto-create topics: enabled
```

**Health check:**
```bash
# List topics
docker compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# Check broker API versions (verifies broker is alive)
docker compose exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092

# Produce a test message
docker compose exec kafka kafka-console-producer --bootstrap-server localhost:9092 --topic test-topic
```

---

### LocalStack (S3)

**What it does:** Local AWS S3-compatible storage for resumes, offer letters, documents, and other file uploads.

**Default local credentials:**
```
Endpoint: http://localhost:4566
Region: us-east-1
Access Key: test
Secret Key: test
Bucket: interview-platform-documents
```

**Health check:**
```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# List S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# Create bucket manually (if needed)
aws --endpoint-url=http://localhost:4566 s3 mb s3://interview-platform-documents

# Upload a test file
echo "test" | aws --endpoint-url=http://localhost:4566 s3 cp - s3://interview-platform-documents/test.txt

# Verify
aws --endpoint-url=http://localhost:4566 s3 ls s3://interview-platform-documents/
```

> **Note:** Set `AWS_ACCESS_KEY_ID=test` and `AWS_SECRET_ACCESS_KEY=test` in your shell or use `--no-sign-request`.

---

### HashiCorp Vault 1.15

**What it does:** Secret management for production credentials (JWT keys, DB passwords, API keys). In dev mode, it uses an in-memory store with a known root token.

**Default local credentials:**
```
Address: http://localhost:8200
Root Token: dev-root-token
Auth Method: Token
KV Backend: secret/interview-platform
```

**Health check:**
```bash
# Check status
curl http://localhost:8200/v1/sys/health

# Using vault CLI
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=dev-root-token
vault status
vault secrets list

# Write a test secret
vault kv put secret/interview-platform jwt-secret="my-secret-key"

# Read it back
vault kv get secret/interview-platform
```

---

### OpenTelemetry Collector 0.102

**What it does:** Receives traces, metrics, and logs from the application (via OTLP) and routes them to Jaeger (traces) and Prometheus (metrics).

**Default local config:**
```
OTLP gRPC receiver: localhost:4317
OTLP HTTP receiver: localhost:4318
Prometheus exporter: localhost:8889
Health check: localhost:13133
```

**Health check:**
```bash
# Collector health
curl http://localhost:13133/

# Check Prometheus metrics endpoint
curl http://localhost:8889/metrics | head -20
```

---

### Jaeger 1.57

**What it does:** Trace visualization UI. View distributed traces, latency analysis, and service dependency graphs.

**Default local config:**
```
UI: http://localhost:16686
gRPC (from OTel Collector): localhost:14250
```

**Health check:**
```bash
# Jaeger health
curl http://localhost:14269/

# Open UI in browser
open http://localhost:16686
```

---

## 3. OAuth2 Providers

### Google OAuth2

**Step-by-step setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services > Credentials**
4. Click **+ CREATE CREDENTIALS > OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first:
   - User Type: **External** (for testing; Internal if using Google Workspace)
   - App name: `Interview Platform`
   - User support email: your email
   - Scopes: Add `openid`, `profile`, `email`
   - Test users: add your email
6. Back in Credentials, select **Web application**
7. Set **Authorized redirect URIs**:
   ```
   http://localhost:8080/login/oauth2/code/google
   ```
8. Copy the **Client ID** and **Client Secret**

**Scopes required:** `openid`, `profile`, `email`

**Additional scopes for Calendar Sync:** `https://www.googleapis.com/auth/calendar` (enable Calendar API in the project)

**Environment variables:**
```bash
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

**Test locally:**
```bash
# Start app, then visit:
open "http://localhost:8080/oauth2/authorization/google"
# Should redirect to Google login, then back to your redirect URI
```

---

### GitHub OAuth2

**Step-by-step setup:**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps > New OAuth App**
3. Fill in:
   - Application name: `Interview Platform (dev)`
   - Homepage URL: `http://localhost:8080`
   - Authorization callback URL: `http://localhost:8080/login/oauth2/code/github`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it immediately

**Scopes required:** `user:email`, `read:user`

**Environment variables:**
```bash
GITHUB_CLIENT_ID=Ov23lixxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Test locally:**
```bash
open "http://localhost:8080/oauth2/authorization/github"
```

---

### Microsoft OAuth2 (Azure AD)

**Step-by-step setup:**

1. Go to [Azure Portal - App registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Click **+ New registration**
3. Fill in:
   - Name: `Interview Platform`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: **Web** > `http://localhost:8080/login/oauth2/code/microsoft`
4. Click **Register**
5. Copy the **Application (client) ID**
6. Go to **Certificates & secrets > + New client secret**
7. Add a description, select expiry, click **Add**
8. Copy the **Value** (not the Secret ID) immediately

**Scopes required:** `openid`, `profile`, `email`

**Additional scopes for Outlook Calendar:** `Calendars.ReadWrite`, `offline_access`

**Environment variables:**
```bash
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Test locally:**
```bash
open "http://localhost:8080/oauth2/authorization/microsoft"
```

---

## 4. Email Service (SMTP)

### Option A: Gmail App Password (Recommended for Dev)

**Step-by-step setup:**

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (required for app passwords)
3. Go to [App passwords](https://myaccount.google.com/apppasswords)
4. Select app: **Mail**, Select device: **Other** (enter "Interview Platform")
5. Click **Generate**
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

**Environment variables:**
```bash
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-real-email@gmail.com
MAIL_PASSWORD=abcdefghijklmnop    # No spaces, 16 chars
```

**Test:**
```bash
# The app will send emails via Gmail SMTP on user registration, password reset, etc.
# Check app logs for: "Email sent successfully to..."
# Or use the /api/v1/auth/forgot-password endpoint with a real email
```

---

### Option B: MailHog for Local Testing (No Real SMTP Needed)

MailHog captures all outgoing emails without actually sending them.

**Add to `compose.yaml`:**
```yaml
mailhog:
  image: mailhog/mailhog:latest
  ports:
    - '1025:1025'   # SMTP
    - '8025:8025'   # Web UI
```

**Environment variables:**
```bash
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=anything
MAIL_PASSWORD=anything
```

**Access captured emails:**
```bash
open http://localhost:8025
```

---

### Option C: SendGrid (Production)

1. Sign up at [SendGrid](https://signup.sendgrid.com/)
2. Go to **Settings > API Keys > Create API Key**
3. Select **Restricted Access** with Mail Send permissions
4. Copy the key (starts with `SG.`)

```bash
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxx
```

---

### Option D: Mailgun (Production)

1. Sign up at [Mailgun](https://signup.mailgun.com/new/signup)
2. Add and verify your domain
3. Get SMTP credentials from **Sending > Domain settings > SMTP credentials**

```bash
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=postmaster@your-domain.mailgun.org
MAIL_PASSWORD=your-mailgun-smtp-password
```

---

## 5. Messaging & Notifications

### Twilio SMS

**Step-by-step setup:**

1. Sign up at [Twilio Console](https://www.twilio.com/try-twilio) (free trial gives $15 credit)
2. After signup, you'll see your **Account SID** and **Auth Token** on the dashboard
3. Get a phone number: **Phone Numbers > Manage > Buy a number** (free trial includes one)
4. Verify your personal number for trial (trial only sends to verified numbers)

**Environment variables:**
```bash
SMS_ENABLED=true
SMS_PROVIDER=twilio

# Add these to application.yml or .env (not yet in defaults - add when implementing):
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+15551234567
```

**Test:**
```bash
# Verify credentials via Twilio CLI
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json" \
  --data-urlencode "Body=Test from Interview Platform" \
  --data-urlencode "From=${TWILIO_FROM_NUMBER}" \
  --data-urlencode "To=+1YOUR_VERIFIED_NUMBER" \
  -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}"
```

> **Note:** Current implementation logs SMS messages. The Twilio SDK integration is scaffolded but requires adding `com.twilio.sdk:twilio` dependency to `pom.xml`.

---

### Slack Webhook

**Step-by-step setup:**

1. Go to [Slack API - Your Apps](https://api.slack.com/apps)
2. Click **Create New App > From scratch**
3. Name: `Interview Platform Notifications`, select your workspace
4. Go to **Incoming Webhooks** in the left sidebar
5. Toggle **Activate Incoming Webhooks** to ON
6. Click **Add New Webhook to Workspace**
7. Select the channel (e.g., `#hiring-notifications`)
8. Click **Allow**
9. Copy the **Webhook URL**

**Environment variables:**
```bash
SLACK_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TXXXXX/BXXXXX/your-webhook-token-here
```

**Test:**
```bash
curl -X POST "${SLACK_WEBHOOK_URL}" \
  -H 'Content-Type: application/json' \
  -d '{"text": "Interview Platform test notification"}'
# Expected: "ok"
```

---

### Microsoft Teams Webhook

**Step-by-step setup:**

1. Open Microsoft Teams
2. Go to the channel where you want notifications
3. Click the **...** (more options) next to the channel name
4. Select **Connectors** (or **Manage channel** > **Connectors**)
5. Find **Incoming Webhook** and click **Configure**
6. Name: `Interview Platform`, optionally upload an icon
7. Click **Create**
8. Copy the **Webhook URL**

**Environment variables:**
```bash
TEAMS_ENABLED=true
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/IncomingWebhook/xxxxxxxxxxxxxxxxxxxxxxxxxxxx/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Test:**
```bash
curl -X POST "${TEAMS_WEBHOOK_URL}" \
  -H 'Content-Type: application/json' \
  -d '{"text": "Interview Platform test notification"}'
# Expected: "1" (Teams returns "1" on success)
```

---

## 6. Meeting Providers

### Zoom

**Step-by-step setup:**

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Click **Develop > Build App**
3. Select **Server-to-Server OAuth** (for automated meeting creation)
4. Fill in app information
5. Add scopes:
   - `meeting:write:admin` (create meetings)
   - `meeting:read:admin` (read meeting details)
6. Once activated, go to **App Credentials**
7. Copy **Account ID**, **Client ID**, and **Client Secret**

**Environment variables:**
```bash
ZOOM_ENABLED=true
ZOOM_ACCOUNT_ID=your-zoom-account-id
ZOOM_CLIENT_ID=your-zoom-client-id
ZOOM_CLIENT_SECRET=your-zoom-client-secret
```

**Test:**
```bash
# The platform generates meeting links via the MeetingService when scheduling interviews
# Check logs for: "Zoom meeting created: ID=..., URL=..."
```

---

### Google Meet

**What it does:** Creates Google Meet links for interviews using the Google Calendar API (a calendar event with `conferenceData`).

**Setup:** Reuses the same Google OAuth2 credentials configured in Section 3.

**Additional steps:**

1. In [Google Cloud Console](https://console.cloud.google.com/), go to **APIs & Services > Library**
2. Search for **Google Calendar API** and click **Enable**
3. Ensure your OAuth consent screen includes the scope:
   ```
   https://www.googleapis.com/auth/calendar
   ```

**Environment variables:**
```bash
GOOGLE_MEET_ENABLED=true
GOOGLE_MEET_CLIENT_ID=${GOOGLE_CLIENT_ID}   # Same as OAuth2 client
```

**Test:**
```bash
# Create an interview with provider=GOOGLE_MEET via the API
# The platform will use the user's OAuth2 token to create a Calendar event with Meet link
```

---

## 7. E-Signature Providers

### DocuSign

**Step-by-step setup:**

1. Go to [DocuSign Developer Center](https://developers.docusign.com/)
2. Click **Create Free Account** (developer sandbox)
3. After signup, go to **Settings > Apps and Keys**
4. Click **Add App and Integration Key**
5. Name: `Interview Platform`
6. Copy the **Integration Key** (this is your client ID)
7. Under **Authentication**, add a redirect URI:
   ```
   http://localhost:8080/api/v1/offers/docusign/callback
   ```
8. Note your **API Account ID** (shown on the Apps and Keys page)
9. For server-to-server, generate an RSA keypair in the app settings

**Environment variables:**
```bash
DOCUSIGN_ENABLED=true
DOCUSIGN_API_URL=https://demo.docusign.net/restapi
DOCUSIGN_ACCOUNT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DOCUSIGN_INTEGRATION_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Test:**
```bash
# Use the DocuSign sandbox UI to verify your app:
open "https://appdemo.docusign.com"
# Login with your developer account to see sent envelopes
```

> **Note:** Current implementation is scaffolded with placeholder logic. Full integration requires the `docusign-esign-java` SDK.

---

### HelloSign (Dropbox Sign)

**Step-by-step setup:**

1. Go to [Dropbox Sign (HelloSign)](https://www.hellosign.com/)
2. Sign up for a free account
3. Go to **Settings > API** (or [API Dashboard](https://app.hellosign.com/home/myAccount#api))
4. Copy your **API Key**
5. Enable **Test Mode** for development (no real signatures sent)

**Environment variables:**
```bash
HELLOSIGN_ENABLED=true
HELLOSIGN_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Test:**
```bash
# Verify API key
curl -u "${HELLOSIGN_API_KEY}:" https://api.hellosign.com/v3/account
# Should return your account info
```

> **Note:** Current implementation is scaffolded with placeholder logic. Full integration requires the HelloSign Java SDK.

---

## 8. Calendar Sync

### Google Calendar API

**Setup:** Uses the same Google OAuth2 app from Section 3.

**Additional configuration:**

1. In [Google Cloud Console](https://console.cloud.google.com/apis/library):
   - Search **Google Calendar API** and click **Enable**
2. In OAuth consent screen, add scopes:
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   ```
3. The platform uses the existing OAuth2 credentials (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)

**How it works:**
- Users connect their Google Calendar via OAuth2 flow at `/api/v1/calendar-sync/connect/google`
- The platform exchanges the auth code for access + refresh tokens
- Events (interviews) are created/updated/deleted in the user's calendar
- Token refresh is automatic via the `GoogleCalendarProvider`

**Environment variables:** (already set via Google OAuth2)
```bash
GOOGLE_CLIENT_ID=<same as OAuth2>
GOOGLE_CLIENT_SECRET=<same as OAuth2>
CALENDAR_SYNC_ENABLED=true
CALENDAR_SYNC_INTERVAL=15
```

---

### Microsoft Graph API (Outlook Calendar)

**Setup:** Uses the same Microsoft OAuth2 app from Section 3.

**Additional configuration:**

1. In [Azure Portal > App registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade):
   - Select your app
   - Go to **API permissions > Add a permission**
   - Select **Microsoft Graph > Delegated permissions**
   - Add:
     - `Calendars.ReadWrite`
     - `offline_access` (for refresh tokens)
   - Click **Grant admin consent** (if you're the admin)
2. Add redirect URI for calendar callback:
   ```
   http://localhost:8080/api/v1/calendar-sync/callback/outlook
   ```

**How it works:**
- Users connect their Outlook Calendar via OAuth2 flow at `/api/v1/calendar-sync/connect/outlook`
- Uses Microsoft Graph API (`https://graph.microsoft.com/v1.0/me/calendar/events`)
- Scopes requested during token exchange: `Calendars.ReadWrite offline_access`

**Environment variables:** (already set via Microsoft OAuth2)
```bash
MICROSOFT_CLIENT_ID=<same as OAuth2>
MICROSOFT_CLIENT_SECRET=<same as OAuth2>
```

---

## 9. Security Scanning (CI/CD)

### SonarCloud

**Step-by-step setup:**

1. Go to [SonarCloud](https://sonarcloud.io/) and sign up with GitHub
2. Click **+** > **Analyze new project**
3. Select your repository
4. Go to **My Account > Security > Generate Tokens**
5. Token name: `interview-platform-ci`
6. Copy the token (starts with `sqp_`)

**Run locally:**
```bash
# Set token
export SONAR_TOKEN=sqp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Run analysis
./mvnw sonar:sonar \
  -Dsonar.projectKey=interview-platform-backend \
  -Dsonar.organization=your-org \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.token=${SONAR_TOKEN}
```

**GitHub Actions secret:**
```
SONAR_TOKEN=sqp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### OWASP Dependency-Check

**No credentials needed.** Uses the public NVD (National Vulnerability Database).

```bash
# Run locally
./mvnw dependency-check:check

# With CI profile
./mvnw verify -Psecurity-scan

# Reports generated at:
# target/dependency-check-report.html
# target/dependency-check-report.json
```

> **Note:** NVD rate limits anonymous requests. For CI, optionally set an NVD API key (free):
> Register at https://nvd.nist.gov/developers/request-an-api-key

```bash
# Optional: faster scans with NVD API key
./mvnw dependency-check:check -DnvdApiKey=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

### Trivy (Container Scanning)

**No credentials needed.** Open-source vulnerability scanner.

```bash
# Install
brew install trivy

# Scan the Docker image
docker build -t interview-platform:latest .
trivy image interview-platform:latest

# Scan filesystem (dependencies)
trivy fs --scanners vuln .
```

---

## 10. Secret Management

### HashiCorp Vault

#### Local Development (Dev Mode)

Dev mode runs entirely in Docker with no signup required:

```bash
docker compose up vault
```

**Access:**
```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=dev-root-token

# Store secrets
vault kv put secret/interview-platform \
  jwt-secret="your-jwt-secret" \
  db-password="postgres" \
  encryption-key="$(openssl rand -base64 32)"

# Read secrets
vault kv get secret/interview-platform
```

**Application config** (already in `application-vault.yml`):
```bash
VAULT_ENABLED=true
VAULT_HOST=localhost
VAULT_PORT=8200
VAULT_SCHEME=http
VAULT_TOKEN=dev-root-token
```

#### Production Setup

1. Deploy Vault in HA mode (Consul backend or Raft)
2. Initialize and unseal:
   ```bash
   vault operator init -key-shares=5 -key-threshold=3
   vault operator unseal <key1>
   vault operator unseal <key2>
   vault operator unseal <key3>
   ```
3. Use AppRole or Kubernetes auth instead of token:
   ```bash
   vault auth enable approle
   vault write auth/approle/role/interview-platform \
     token_policies="interview-platform-policy" \
     token_ttl=1h \
     token_max_ttl=4h
   ```
4. Create a policy:
   ```hcl
   path "secret/data/interview-platform/*" {
     capabilities = ["read", "list"]
   }
   ```

**Production env vars:**
```bash
VAULT_ENABLED=true
VAULT_HOST=vault.internal.yourcompany.com
VAULT_PORT=8200
VAULT_SCHEME=https
VAULT_AUTH_METHOD=approle
VAULT_ROLE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VAULT_SECRET_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 11. SSO Identity Providers

### Architecture

The platform supports enterprise SSO with:
- **Okta (Primary)** — OpenID Connect (OIDC)
- **Keycloak (Fallback)** — OpenID Connect (OIDC), self-hosted via Docker
- **OneLogin / Azure AD / Generic** — SAML 2.0 (legacy/enterprise)

If Okta OIDC login fails (provider unreachable), the system **automatically falls back** to Keycloak.

---

### Okta (OpenID Connect - Primary SSO)

**Step-by-step setup:**

1. Sign up at [Okta Developer](https://developer.okta.com/signup/)
2. After signup, go to **Applications > Create App Integration**
3. Select **OIDC - OpenID Connect**
4. Application type: **Web Application**
5. Fill in:
   - App name: `Interview Platform`
   - Sign-in redirect URIs: `http://localhost:8080/login/oauth2/code/okta`
   - Sign-out redirect URIs: `http://localhost:5173`
   - Controlled access: Skip group assignment for now
6. Click **Save**
7. Copy **Client ID** and **Client Secret** from the General tab
8. Note your **Okta domain** (e.g., `dev-12345678.okta.com`)
9. Assign users/groups to the app under the **Assignments** tab

**Issuer URI:** `https://{your-okta-domain}/oauth2/default`

**Environment variables:**
```bash
OKTA_CLIENT_ID=0oaxxxxxxxxxxxxxxxxx
OKTA_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OKTA_ISSUER_URI=https://dev-xxxxxxxx.okta.com/oauth2/default
OKTA_AUTH_URL=https://dev-xxxxxxxx.okta.com/oauth2/default/v1/authorize
OKTA_TOKEN_URL=https://dev-xxxxxxxx.okta.com/oauth2/default/v1/token
OKTA_USERINFO_URL=https://dev-xxxxxxxx.okta.com/oauth2/default/v1/userinfo
OKTA_JWKS_URL=https://dev-xxxxxxxx.okta.com/oauth2/default/v1/keys
```

**Test locally:**
```bash
open "http://localhost:8080/oauth2/authorization/okta"
# Should redirect to Okta login, then back with tokens
```

---

### Keycloak (OpenID Connect - Fallback SSO)

**Runs locally via Docker Compose** (already included in `compose.yaml`).

**Default credentials:**
```
Admin Console: http://localhost:9090
Admin Username: admin
Admin Password: admin
Realm: interview-platform
Client ID: interview-platform
Client Secret: FqQdEOnNuda9oTWvk2AgcKdOARHUCQgV
```

**Setup after first `docker compose up`:**

1. Open Keycloak Admin Console: http://localhost:9090
2. Login with `admin` / `admin`
3. Create a new Realm: `interview-platform`
4. Go to **Clients > Create client**:
   - Client type: **OpenID Connect**
   - Client ID: `interview-platform`
   - Client authentication: **ON** (confidential)
5. Under **Settings**:
   - Valid Redirect URIs: `http://localhost:8080/login/oauth2/code/keycloak`
   - Web Origins: `http://localhost:8080`, `http://localhost:5173`
6. Under **Credentials** tab: copy/set secret to `FqQdEOnNuda9oTWvk2AgcKdOARHUCQgV`
7. Create test users under **Users > Add user**

**Environment variables:**
```bash
KEYCLOAK_SSO_ENABLED=true
KEYCLOAK_SERVER_URL=http://localhost:9090
KEYCLOAK_REALM=interview-platform
KEYCLOAK_CLIENT_ID=interview-platform
KEYCLOAK_CLIENT_SECRET=FqQdEOnNuda9oTWvk2AgcKdOARHUCQgV
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_ISSUER_URI=http://localhost:9090/realms/interview-platform
KEYCLOAK_AUTH_URL=http://localhost:9090/realms/interview-platform/protocol/openid-connect/auth
KEYCLOAK_TOKEN_URL=http://localhost:9090/realms/interview-platform/protocol/openid-connect/token
KEYCLOAK_USERINFO_URL=http://localhost:9090/realms/interview-platform/protocol/openid-connect/userinfo
KEYCLOAK_JWKS_URL=http://localhost:9090/realms/interview-platform/protocol/openid-connect/certs
```

**Test locally:**
```bash
open "http://localhost:8080/oauth2/authorization/keycloak"
# Should redirect to Keycloak login, then back with tokens
```

---

### SAML 2.0 Providers (OneLogin, Azure AD, Generic)

These remain available for enterprises that require SAML 2.0.
Configurations are stored per-tenant in the database and managed via the `/api/v1/sso` endpoints.

---

## 11.5 ATS Integrations

### Workday

**Step-by-step setup:**

1. Contact your Workday administrator for API access
2. In Workday Admin: **Integration > API Client Registration**
3. Register an API client:
   - Client Name: `Interview Platform`
   - Scope: Recruiting (Staffing)
4. Note the **Tenant URL** (e.g., `https://wd5-impl-services1.workday.com/ccx/api/v1/your-tenant`)
5. Copy the **Client ID** and generate a **Client Secret**

**Environment variables:**
```bash
WORKDAY_TENANT_URL=https://wd5-impl-services1.workday.com/ccx/api/v1/your-tenant
WORKDAY_CLIENT_ID=your-workday-client-id
```

---

### Greenhouse (ATS)

**Step-by-step setup:**

1. Go to [Greenhouse](https://www.greenhouse.io/) — requires an active account
2. Login to your Greenhouse dashboard
3. Go to **Configure > Dev Center > API Credential Management**
4. Click **Create New API Key**
5. Select type: **Harvest API** (for full access to candidates, jobs, etc.)
6. Copy the generated API key

**Environment variables:**
```bash
GREENHOUSE_API_KEY=your-greenhouse-harvest-api-key
GREENHOUSE_BASE_URL=https://harvest.greenhouse.io/v1
```

**Test:**
```bash
curl -u "${GREENHOUSE_API_KEY}:" https://harvest.greenhouse.io/v1/candidates?per_page=1
# Should return candidate data
```

---

### Lever (ATS)

**Step-by-step setup:**

1. Go to [Lever](https://www.lever.co/) — requires an active account
2. Login to your Lever dashboard
3. Go to **Settings > Integrations & API > API Credentials**
4. Click **Generate New Key**
5. Select permissions: Candidates (read/write), Postings (read)
6. Copy the API key

**Environment variables:**
```bash
LEVER_API_KEY=your-lever-api-key
LEVER_BASE_URL=https://api.lever.co/v1
```

**Test:**
```bash
curl -u "${LEVER_API_KEY}:" https://api.lever.co/v1/postings?limit=1
# Should return postings
```

---

## 11.6 Job Board Posting

### LinkedIn

**Step-by-step setup:**

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Click **Create app**
3. Fill in: Company page, app name, logo
4. Under **Products**, request access to **Share on LinkedIn** and **Job Posting API**
5. Go to **Auth** tab → copy **Client ID** and **Client Secret**
6. Generate an **Access Token** (OAuth 2.0 3-legged flow or use LinkedIn's token generator)

**Environment variables:**
```bash
LINKEDIN_ACCESS_TOKEN=your-linkedin-access-token
```

> **Note:** LinkedIn tokens expire (60 days). For production, implement token refresh flow.

---

### Indeed

**Step-by-step setup:**

1. Go to [Indeed Publisher Portal](https://developers.indeed.com/)
2. Sign up for a publisher account
3. Navigate to **API Keys** in your dashboard
4. Create a new application
5. Copy the **Employer ID** and **API Key**

**Environment variables:**
```bash
INDEED_EMPLOYER_ID=your-indeed-employer-id
INDEED_API_KEY=your-indeed-api-key
```

---

### Glassdoor

**Step-by-step setup:**

1. Go to [Glassdoor API](https://www.glassdoor.com/developer/index.htm)
2. Apply for API access (requires approval)
3. Once approved, you'll receive an **API Key** and **Partner ID**
4. API documentation: https://www.glassdoor.com/developer/index.htm

**Environment variables:**
```bash
GLASSDOOR_API_KEY=your-glassdoor-api-key
```

---

## 11.7 Feature Flags

### LaunchDarkly

**Step-by-step setup:**

1. Sign up at [LaunchDarkly](https://launchdarkly.com/) (14-day free trial)
2. Create a project: `interview-platform`
3. Go to **Account Settings > Projects > interview-platform > Environments**
4. Copy the **SDK Key** for your environment (Development/Production)

**Environment variables:**
```bash
FEATURE_FLAGS_PROVIDER=launchdarkly
LAUNCHDARKLY_SDK_KEY=sdk-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Test:**
```bash
# Feature flags are read on startup and cached
curl -H "Authorization: Bearer $TOKEN" localhost:8080/api/v1/feature-flags
```

---

### Flagsmith (Alternative)

**Step-by-step setup:**

1. Sign up at [Flagsmith](https://www.flagsmith.com/) (free tier: 50k requests/month)
2. Create an organisation and project
3. Go to **Settings > Keys**
4. Copy the **Server-side Environment Key**

**Environment variables:**
```bash
FEATURE_FLAGS_PROVIDER=flagsmith
FLAGSMITH_API_KEY=ser.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FLAGSMITH_BASE_URL=https://edge.api.flagsmith.com/api/v1
```

---

## 11.8 Candidate Sourcing

### GitHub Personal Access Token (for Developer Search)

**Step-by-step setup:**

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Name: `Interview Platform Sourcing`
4. Select scopes:
   - `read:user` (read user profile data)
   - `user:email` (read user email)
5. Click **Generate token**
6. Copy the token immediately (starts with `ghp_`)

**Environment variables:**
```bash
GITHUB_SOURCING_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Test:**
```bash
curl -H "Authorization: Bearer ${GITHUB_SOURCING_TOKEN}" \
  "https://api.github.com/search/users?q=language:java+location:bangalore&per_page=5"
# Should return developer profiles
```

> **Rate limits:** 30 requests/minute for authenticated search API.

---

## 11.9 OpenAI (AI Services)

### OpenAI API Key

**Step-by-step setup:**

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to **API Keys** (https://platform.openai.com/api-keys)
4. Click **Create new secret key**
5. Name: `Interview Platform`
6. Copy the key (starts with `sk-`)

**Pricing:** Pay-per-use. GPT-4o-mini costs ~$0.15/1M input tokens, ~$0.60/1M output tokens.

**Environment variables:**
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
AI_SCORING_ENABLED=true
```

**Test:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer ${OPENAI_API_KEY}" | head -5
# Should return available models list
```

> **Note:** All 13 AI services (Coach, Matching, Screening, Scoring, etc.) use this single API key.

---

## 11.10 Payment Gateways — How to Get Credentials & Collect Payments

The platform supports **5 payment gateways** for subscription billing and one-time payments. Stripe handles international payments; Razorpay/PayU/Cashfree/PhonePe handle India (UPI, Cards, NetBanking, Wallets).

### How Payment Collection Works

```
Organization Admin (your customer)
        │
        ▼
[Frontend] Settings > Billing > Upgrade Plan
        │ POST /api/v1/billing/checkout
        ▼
[BillingService] creates a Checkout Session on Stripe (or payment order on Indian gateway)
        │ returns checkout URL
        ▼
[Frontend] redirects customer to hosted payment page (Stripe/Razorpay/etc.)
        │ customer enters card/UPI/netbanking details
        ▼
[Payment Gateway] processes payment, sends webhook to your backend
        │ POST /api/v1/billing/webhooks/stripe
        ▼
[BillingController] verifies webhook signature, updates subscription status
        │ marks PaymentTransaction as CAPTURED, Invoice as PAID
        ▼
[Organization] now has active subscription with upgraded features
```

**Subscription Plans (seeded in DB):**

| Plan | USD/mo | INR/mo | Limits |
|------|--------|--------|--------|
| Free | $0 | ₹0 | 5 interviews/mo, 2 users, 1GB storage |
| Starter | $29 | ₹2,499 | 50 interviews/mo, 10 users, 10GB, basic AI |
| Professional | $99 | ₹7,999 | 500 interviews/mo, 50 users, 100GB, full AI + video |
| Enterprise | $299 | ₹24,999 | Unlimited, SSO, white-labeling, API access, dedicated support |

---

### Stripe (International — Cards, SEPA, Apple Pay, Google Pay)

**Step-by-step setup:**

1. Sign up at [Stripe Dashboard](https://dashboard.stripe.com/register)
2. After email verification, you're in **Test mode** automatically (no real charges)
3. Go to **Developers > API Keys**
4. Copy the **Secret key** (starts with `sk_test_`)
5. For webhooks: **Developers > Webhooks > Add endpoint**
   - Endpoint URL: `https://your-backend.com/api/v1/billing/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Copy the **Signing secret** (starts with `whsec_`)
6. Create Products & Prices in **Products** tab (or via API)

**Environment variables:**
```bash
BILLING_ENABLED=true
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Test payments (Stripe test cards):**
```
Success:        4242 4242 4242 4242 (any future date, any CVC)
Declined:       4000 0000 0000 0002
Requires auth:  4000 0025 0000 3155
```

**How to charge a customer:**
```bash
# 1. Create a customer (call from your admin panel)
curl -X POST localhost:8080/api/v1/billing/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "customer@company.com", "name": "Acme Corp"}'

# 2. Create a checkout session (redirects customer to pay)
curl -X POST localhost:8080/api/v1/billing/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_xxxxx",
    "priceId": "price_xxxxx",
    "successUrl": "http://localhost:5173/settings/billing?success=true",
    "cancelUrl": "http://localhost:5173/settings/billing?cancelled=true"
  }'
# Returns: { "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..." }

# 3. Customer completes payment on Stripe's hosted page
# 4. Stripe sends webhook → your backend updates subscription status
```

**Going live (production):**
1. Complete Stripe account activation (business details, bank account)
2. Switch from `sk_test_` to `sk_live_` key
3. Update webhook endpoint to production URL
4. Set `BILLING_DEFAULT_CURRENCY=USD` (or `INR` for India)

---

### Razorpay (India — UPI, Cards, NetBanking, Wallets, EMI)

**Step-by-step setup:**

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/signup)
2. Use **Test mode** (toggle at top of dashboard) — no KYC needed for testing
3. Go to **Settings > API Keys > Generate Key**
4. Copy **Key ID** (starts with `rzp_test_`) and **Key Secret**
5. For webhooks: **Settings > Webhooks > Add New Webhook**
   - URL: `https://your-backend.com/api/v1/billing/webhooks/razorpay`
   - Events: `payment.captured`, `subscription.activated`, `subscription.cancelled`
   - Copy the **Webhook Secret**

**Environment variables:**
```bash
RAZORPAY_ENABLED=true
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```

**How to charge a customer (India):**
```bash
# 1. Create a payment order
curl -X POST localhost:8080/api/v1/billing/razorpay/orders \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 249900, "currency": "INR", "planSlug": "starter"}'
# Returns: { "orderId": "order_xxx", "amount": 249900, "currency": "INR" }

# 2. Frontend opens Razorpay checkout with the orderId
# 3. Customer pays via UPI/Card/NetBanking
# 4. Razorpay calls webhook → backend verifies signature + updates status
```

**Test UPI:** Use `success@razorpay` as VPA in test mode  
**Test Card:** `4111 1111 1111 1111` (any future date, any CVV)

**Going live:**
1. Complete KYC on Razorpay dashboard
2. Switch to live keys (toggle off Test mode)
3. Add bank account for settlements

---

### PayU (India — UPI, Cards, NetBanking, Wallets, BNPL)

**Step-by-step setup:**

1. Sign up at [PayU Business](https://payu.in/business)
2. Use Test dashboard at https://test.payu.in (or sandbox.payu.in)
3. Go to **Dashboard > Manage Account > Merchant Key & Salt**
4. Copy the **Merchant Key** and **Salt (v2)**
5. Use test credentials for sandbox:
   - Test URL: `https://test.payu.in/_payment`
   - Production URL: `https://secure.payu.in/_payment`

**Environment variables:**
```bash
PAYU_ENABLED=true
PAYU_MERCHANT_KEY=your-merchant-key
PAYU_MERCHANT_SALT=your-merchant-salt-v2
PAYU_BASE_URL=https://test.payu.in
```

**Test cards:**
```
Success: 5123 4567 8901 2346 (CVV: 123, Expiry: any future)
Failure: 4000 0000 0000 0002
```

**Going live:**
1. Complete merchant verification with PayU
2. Switch `PAYU_BASE_URL` to `https://secure.payu.in`
3. Use production Merchant Key / Salt

---

### Cashfree (India — UPI, Cards, NetBanking, PayLater, EMI)

**Step-by-step setup:**

1. Sign up at [Cashfree Merchant](https://merchant.cashfree.com/signup)
2. Use **Sandbox** mode (no KYC needed)
3. Go to **Developers > API Keys**
4. Select **Sandbox** environment
5. Copy the **App ID** and **Secret Key**
6. Webhook: **Developers > Webhooks > Add Endpoint**
   - URL: `https://your-backend.com/api/v1/billing/webhooks/cashfree`
   - Events: `PAYMENT_SUCCESS`, `SUBSCRIPTION_STATUS`

**Environment variables:**
```bash
CASHFREE_ENABLED=true
CASHFREE_APP_ID=your-sandbox-app-id
CASHFREE_SECRET_KEY=your-sandbox-secret-key
CASHFREE_BASE_URL=https://sandbox.cashfree.com/pg
```

**Test UPI:** `testsuccess@gocash` (always succeeds in sandbox)

**Going live:**
1. Complete KYC on Cashfree
2. Switch to Production API keys
3. Change `CASHFREE_BASE_URL=https://api.cashfree.com/pg`

---

### PhonePe (India — UPI, Cards, NetBanking, Wallets)

**Step-by-step setup:**

1. Sign up at [PhonePe Business](https://business.phonepe.com/)
2. Apply for **UAT (sandbox)** access via the developer portal
3. Once approved, go to **Integration Dashboard**
4. Copy **Merchant ID**, **Salt Key**, and **Salt Index** (usually `1`)
5. Use UAT/sandbox environment for testing

**Environment variables:**
```bash
PHONEPE_ENABLED=true
PHONEPE_MERCHANT_ID=PGTESTPAYUAT
PHONEPE_SALT_KEY=099eb0cd-02cf-4e2a-8aca-3e6c6aff0399
PHONEPE_SALT_INDEX=1
PHONEPE_BASE_URL=https://api-preprod.phonepe.com/apis/pg-sandbox
```

> **Note:** The above are PhonePe's public UAT credentials for testing.

**Going live:**
1. Complete merchant onboarding with PhonePe
2. Switch to production credentials
3. Change `PHONEPE_BASE_URL=https://api.phonepe.com/apis/hermes`

---

### Which Gateway to Use?

| Use Case | Recommended Gateway |
|----------|-------------------|
| International customers (US/EU) | **Stripe** |
| Indian customers (all methods) | **Razorpay** (most popular in India) |
| Indian UPI-heavy | **PhonePe** or **Cashfree** |
| Indian with BNPL/EMI | **PayU** or **Cashfree** |
| Multi-gateway (failover) | Enable multiple, route by currency |

**Multi-gateway strategy:** Enable Stripe for USD/EUR and Razorpay for INR. The `PaymentGatewayProvider` interface allows routing payments to the correct gateway based on currency:

```java
// In your code, select gateway by currency:
if ("INR".equals(currency)) {
    razorpayGateway.createPaymentOrder(amount, currency, metadata);
} else {
    stripeGateway.createCheckoutSession(customerId, priceId, urls);
}
```

---

## 11.11 Data Residency & Mobile SDK

### Data Residency

No external credentials needed. Configuration controls which AWS regions are used for data storage per-tenant.

**Environment variables:**
```bash
DATA_RESIDENCY_DEFAULT_REGION=us-east-1
DATA_RESIDENCY_EU_REGION=eu-west-1
DATA_RESIDENCY_AP_REGION=ap-south-1
```

---

### Mobile SDK Configuration

No external credentials needed. Controls mobile app behavior remotely.

**Environment variables:**
```bash
MOBILE_MIN_VERSION=1.0.0
MOBILE_FORCE_UPDATE=false
MOBILE_MAINTENANCE_MODE=false
```

---

## 12. Minimum Viable Setup

| Setup Level | Services Needed | External Signups | What Works |
|-------------|----------------|------------------|------------|
| **Just run locally** | Docker only | None | Full app with DB, Redis, Kafka, S3 (LocalStack), tracing. Email/SMS/OAuth logged but not sent. |
| **Full local dev** | Docker + Gmail app password | Gmail 2FA + app password | Everything above + real email delivery (registration, password reset, notifications) |
| **All features working** | Docker + OAuth2 providers + SMTP + Slack | Google Cloud, GitHub, Azure, Gmail, Slack | Full OAuth2 login, email, Slack notifications, calendar sync |
| **Production** | Managed DB + Redis + Kafka + Vault + real S3 | All above + DocuSign + Twilio + Zoom + SonarCloud | Everything including e-signatures, SMS, video meetings, secret rotation |

### Quick Start (Minimum - Docker Only)

```bash
# 1. Clone and copy env
cp .env.example .env

# 2. Generate encryption key
ENCRYPTION_KEY=$(openssl rand -base64 32)
sed -i '' "s/ENCRYPTION_SECRET_KEY=/ENCRYPTION_SECRET_KEY=${ENCRYPTION_KEY}/" .env

# 3. Start infrastructure
docker compose up -d postgres redis kafka zookeeper localstack vault otel-collector jaeger

# 4. Run the app
./mvnw spring-boot:run

# 5. Verify
curl http://localhost:8080/actuator/health
```

---

## 13. Environment Variables Master List

Complete `.env` file with ALL variables grouped by service:

```bash
# =============================================================================
# Interview Platform Backend - Complete Environment Variables
# =============================================================================
# Copy this file to .env and update values as needed.
# Variables marked [REQUIRED] must be set for the app to start.
# Variables marked [OPTIONAL] have working defaults or disable features gracefully.
# =============================================================================

# =============================================================================
# DATABASE (PostgreSQL) [REQUIRED]
# =============================================================================
# JDBC connection URL. Use port 5433 for Docker-mapped PostgreSQL.
DB_URL=jdbc:postgresql://localhost:5433/interview_platform
# Database username
DB_USERNAME=admin
# Database password
DB_PASSWORD=postgres
# Maximum connection pool size (tune for production load)
DB_POOL_MAX=10
# Hibernate DDL mode: update (dev), validate (prod), none (flyway-only)
JPA_DDL_AUTO=update
# Separate DDL user (production: least-privilege app user + privileged DDL user)
DB_SEPARATE_USERS=false
DB_DDL_URL=jdbc:postgresql://localhost:5433/interview_platform
DB_DDL_USERNAME=admin
DB_DDL_PASSWORD=postgres

# =============================================================================
# SERVER [REQUIRED]
# =============================================================================
# Application port
SERVER_PORT=8080
# Spring Security default user password (for /actuator basic auth)
SPRING_SECURITY_PASSWORD=admin

# =============================================================================
# JWT AUTHENTICATION [REQUIRED]
# =============================================================================
# HMAC secret for signing JWT tokens (min 256 bits / 32 chars)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-jwt-secret-key-here-min-256-bits
# Token expiration in milliseconds (86400000 = 24 hours)
JWT_EXPIRATION=86400000
# Refresh token secret (separate from access token secret)
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-here-min-256-bits
# Refresh token expiration (1209600000 = 14 days)
JWT_REFRESH_EXPIRATION=1209600000
# Load RSA keys from Vault instead of classpath (production)
RSA_FROM_VAULT=false

# =============================================================================
# DATA ENCRYPTION AT REST [REQUIRED for production]
# =============================================================================
# AES-256-GCM key for encrypting PII fields (SSN, salary, etc.)
# Generate with: openssl rand -base64 32
ENCRYPTION_ENABLED=true
ENCRYPTION_SECRET_KEY=

# =============================================================================
# OAUTH2 PROVIDERS [OPTIONAL - app starts without these]
# =============================================================================
# --- Google ---
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# --- GitHub ---
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# --- Microsoft (Azure AD) ---
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# Base URL for OAuth2 redirect URIs (must match provider configuration)
OAUTH2_BASE_URL=http://localhost:8080

# =============================================================================
# FRONTEND [REQUIRED]
# =============================================================================
# Frontend URL for OAuth2 callbacks, password reset links, email verification
FRONTEND_URL=http://localhost:5173
# CORS allowed origins (comma-separated)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# =============================================================================
# EMAIL / SMTP [OPTIONAL - emails logged if invalid]
# =============================================================================
# SMTP host (smtp.gmail.com, smtp.sendgrid.net, localhost for MailHog)
MAIL_HOST=smtp.gmail.com
# SMTP port (587 for TLS, 1025 for MailHog)
MAIL_PORT=587
# SMTP username (email address for Gmail, "apikey" for SendGrid)
MAIL_USERNAME=your-email@gmail.com
# SMTP password (Gmail app password, SendGrid API key, etc.)
MAIL_PASSWORD=your-app-password

# =============================================================================
# REDIS [REQUIRED - used for caching and rate limiting]
# =============================================================================
# Redis host (localhost for Docker, redis hostname for compose network)
REDIS_HOST=localhost
# Redis port
REDIS_PORT=6379

# =============================================================================
# KAFKA [OPTIONAL - can be disabled]
# =============================================================================
# Enable/disable Kafka integration
KAFKA_ENABLED=true
# Kafka broker addresses
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
# Auto-start Kafka listeners
KAFKA_LISTENER_AUTOSTART=true

# =============================================================================
# AWS S3 / LOCALSTACK [REQUIRED for file uploads]
# =============================================================================
# S3 bucket name for documents
AWS_S3_BUCKET_NAME=interview-platform-documents
# AWS region
AWS_S3_REGION=us-east-1
# Access key (use "test" for LocalStack)
AWS_S3_ACCESS_KEY=test
# Secret key (use "test" for LocalStack)
AWS_S3_SECRET_KEY=test
# S3 endpoint (LocalStack URL for dev, omit or set to empty for real AWS)
AWS_S3_ENDPOINT=http://localhost:4566
# Pre-signed URL expiry in minutes
AWS_S3_PRESIGNED_URL_EXPIRY=60

# =============================================================================
# SMS NOTIFICATIONS [OPTIONAL]
# =============================================================================
# Enable/disable SMS sending
SMS_ENABLED=false
# Provider: "log" (dev), "twilio" (production), "sns" (AWS)
SMS_PROVIDER=log
# Twilio credentials (only needed if SMS_PROVIDER=twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+15551234567

# =============================================================================
# SLACK NOTIFICATIONS [OPTIONAL]
# =============================================================================
# Enable/disable Slack notifications
SLACK_ENABLED=false
# Incoming webhook URL from Slack app configuration
SLACK_WEBHOOK_URL=

# =============================================================================
# MICROSOFT TEAMS NOTIFICATIONS [OPTIONAL]
# =============================================================================
# Enable/disable Teams notifications
TEAMS_ENABLED=false
# Incoming webhook URL from Teams connector
TEAMS_WEBHOOK_URL=

# =============================================================================
# GENERAL NOTIFICATIONS [OPTIONAL]
# =============================================================================
# Master switch for all notifications (email, SMS, webhooks)
NOTIFICATIONS_ENABLED=true

# =============================================================================
# MEETING PROVIDERS [OPTIONAL]
# =============================================================================
# --- Zoom (Server-to-Server OAuth) ---
ZOOM_ENABLED=false
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=

# --- Google Meet (reuses Google OAuth2 credentials) ---
GOOGLE_MEET_ENABLED=false
GOOGLE_MEET_CLIENT_ID=

# =============================================================================
# E-SIGNATURE PROVIDERS [OPTIONAL]
# =============================================================================
# --- DocuSign ---
DOCUSIGN_ENABLED=false
DOCUSIGN_API_URL=https://demo.docusign.net/restapi
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_INTEGRATION_KEY=

# --- HelloSign (Dropbox Sign) ---
HELLOSIGN_ENABLED=false
HELLOSIGN_API_KEY=

# =============================================================================
# CALENDAR SYNC [OPTIONAL]
# =============================================================================
# Enable/disable calendar synchronization
CALENDAR_SYNC_ENABLED=true
# Sync interval in minutes
CALENDAR_SYNC_INTERVAL=15

# =============================================================================
# OFFER LETTERS [OPTIONAL]
# =============================================================================
# Days before offer expires
OFFER_EXPIRY_DAYS=7

# =============================================================================
# SSO / IDENTITY PROVIDERS [OPTIONAL]
# =============================================================================
# Base URL for SAML metadata and assertion consumer service
SSO_BASE_URL=http://localhost:8080

# --- Okta OIDC (Primary SSO) ---
OKTA_CLIENT_ID=your-okta-client-id
OKTA_CLIENT_SECRET=your-okta-client-secret
OKTA_ISSUER_URI=https://dev-xxxxxxxx.okta.com/oauth2/default
OKTA_AUTH_URL=https://dev-xxxxxxxx.okta.com/oauth2/default/v1/authorize
OKTA_TOKEN_URL=https://dev-xxxxxxxx.okta.com/oauth2/default/v1/token
OKTA_USERINFO_URL=https://dev-xxxxxxxx.okta.com/oauth2/default/v1/userinfo
OKTA_JWKS_URL=https://dev-xxxxxxxx.okta.com/oauth2/default/v1/keys

# --- Keycloak OIDC (Fallback SSO - self-hosted) ---
KEYCLOAK_SSO_ENABLED=true
KEYCLOAK_SERVER_URL=http://localhost:9090
KEYCLOAK_REALM=interview-platform
KEYCLOAK_CLIENT_ID=interview-platform
KEYCLOAK_CLIENT_SECRET=FqQdEOnNuda9oTWvk2AgcKdOARHUCQgV
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_ISSUER_URI=http://localhost:9090/realms/interview-platform
KEYCLOAK_AUTH_URL=http://localhost:9090/realms/interview-platform/protocol/openid-connect/auth
KEYCLOAK_TOKEN_URL=http://localhost:9090/realms/interview-platform/protocol/openid-connect/token
KEYCLOAK_USERINFO_URL=http://localhost:9090/realms/interview-platform/protocol/openid-connect/userinfo
KEYCLOAK_JWKS_URL=http://localhost:9090/realms/interview-platform/protocol/openid-connect/certs

# =============================================================================
# HASHICORP VAULT [OPTIONAL in dev, REQUIRED in prod]
# =============================================================================
# Enable Vault integration
VAULT_ENABLED=false
# Vault server address
VAULT_HOST=localhost
VAULT_PORT=8200
VAULT_SCHEME=http
# Authentication token (use dev-root-token for local Docker Vault)
VAULT_TOKEN=dev-root-token

# =============================================================================
# OBSERVABILITY (OpenTelemetry) [OPTIONAL]
# =============================================================================
# Service name reported in traces/metrics
OTEL_SERVICE_NAME=interview-platform-backend
# OTLP endpoint (OTel Collector address)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
# Protocol: http/protobuf or grpc
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
# Sampling strategy
OTEL_TRACES_SAMPLER=parentbased_traceidratio
# Sampling rate (1.0 = 100%, 0.1 = 10%)
OTEL_TRACES_SAMPLER_ARG=1.0
# Metrics exporter
OTEL_METRICS_EXPORTER=otlp
# Logs exporter
OTEL_LOGS_EXPORTER=otlp
# Resource attributes (key=value pairs, comma-separated)
OTEL_RESOURCE_ATTRIBUTES=service.namespace=interview-platform,deployment.environment=dev

# =============================================================================
# CODE EXECUTION ENGINE [OPTIONAL]
# =============================================================================
# Enable sandboxed code execution for technical interviews
CODE_EXECUTION_ENABLED=true
# Maximum allowed timeout per execution (ms)
CODE_EXECUTION_MAX_TIMEOUT=30000
# Default timeout if not specified (ms)
CODE_EXECUTION_DEFAULT_TIMEOUT=10000
# Memory limit per container (bytes, 268435456 = 256MB)
CODE_EXECUTION_MEMORY_LIMIT=268435456
# Max concurrent executions
CODE_EXECUTION_MAX_CONCURRENT=10
# Docker socket path
DOCKER_HOST=unix:///var/run/docker.sock

# =============================================================================
# ACCOUNT LOCKOUT / BRUTE FORCE PROTECTION [OPTIONAL]
# =============================================================================
LOCKOUT_ENABLED=true
LOCKOUT_MAX_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30
LOCKOUT_WINDOW_MINUTES=15
LOCKOUT_MAX_IP_ATTEMPTS=20
LOCKOUT_IP_BLOCK_MINUTES=60
LOCKOUT_ALERTS_ENABLED=true
LOCKOUT_ALERT_THRESHOLD=3
LOCKOUT_IP_BLOCKING=true

# =============================================================================
# DOCKER COMPOSE [DEV ONLY]
# =============================================================================
# Let Spring Boot auto-manage Docker Compose lifecycle
DOCKER_COMPOSE_ENABLED=true

# =============================================================================
# CI/CD SECRETS (set in GitHub Actions / CI environment only)
# =============================================================================
# SONAR_TOKEN=sqp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# NVD_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx  (optional, speeds up OWASP scans)
```

---

## Quick Reference: Which Credentials for Which Feature

| Feature | Minimum Credentials |
|---------|-------------------|
| User registration & login (email/password) | JWT_SECRET + DB |
| OAuth2 social login | GOOGLE/GITHUB/MICROSOFT_CLIENT_ID + SECRET |
| SSO (Okta OIDC - primary) | OKTA_CLIENT_ID + OKTA_CLIENT_SECRET + OKTA_ISSUER_URI |
| SSO (Keycloak OIDC - fallback) | Docker Compose (auto-configured) |
| Email notifications | MAIL_USERNAME + MAIL_PASSWORD |
| SMS notifications | TWILIO_ACCOUNT_SID + AUTH_TOKEN + FROM_NUMBER |
| Slack alerts | SLACK_WEBHOOK_URL |
| Teams alerts | TEAMS_WEBHOOK_URL |
| File uploads (resumes, docs) | AWS_S3_* (LocalStack defaults work) |
| Calendar sync (Google) | GOOGLE_CLIENT_ID + SECRET + Calendar API enabled |
| Calendar sync (Outlook) | MICROSOFT_CLIENT_ID + SECRET + Calendars.ReadWrite permission |
| Zoom meetings | ZOOM_ACCOUNT_ID + ZOOM_CLIENT_ID + ZOOM_CLIENT_SECRET |
| Google Meet | GOOGLE_CLIENT_ID + Calendar API enabled |
| E-signatures (DocuSign) | DOCUSIGN_ACCOUNT_ID + INTEGRATION_KEY |
| E-signatures (HelloSign) | HELLOSIGN_API_KEY |
| Code execution (sandboxed) | Docker socket access |
| Distributed tracing | OTEL_* (defaults work with Docker Compose) |
| Secret management | VAULT_TOKEN (dev-root-token for local) |
| Elasticsearch (CQRS search) | ELASTICSEARCH_URI (Docker default: localhost:9200) |
| Kafka UI | Docker Compose (no creds, port 8086) |
| RedisInsight | Docker Compose (no creds, port 5540) |
| Mailpit (dev email) | Docker Compose (no creds, port 8025) |
| Grafana | Docker Compose (admin/admin, port 3001) |
| Prometheus | Docker Compose (no creds, port 9091) |
| Loki (logs) | Docker Compose (no creds, port 3100) |
| SonarCloud analysis | SONAR_TOKEN |

---

## 14. New Services Added (v2.0.0)

### Elasticsearch 8.13 (CQRS Full-Text Search)

**What it does:** Powers the read model for CQRS — full-text search across interviews, candidates, and all entities.

**Default local credentials:**
```
Host: localhost
Port: 9200
Cluster: interview-platform
Security: disabled (dev)
```

**Environment variables:**
```bash
ELASTICSEARCH_URI=http://localhost:9200
SEARCH_ENABLED=true    # Enable CQRS search module
```

**Health check:**
```bash
curl http://localhost:9200/_cluster/health
curl http://localhost:9200/_cat/indices
```

---

### Mailpit (Local Email Testing)

**What it does:** Captures all outgoing emails in a web UI without sending them externally. Replaces MailHog.

**Default local credentials:**
```
SMTP: localhost:1025 (no auth)
Web UI: http://localhost:8025
From Address: noreply@interview-platform.com
```

**Environment variables:**
```bash
MAIL_HOST=mailpit        # (in Docker) or localhost (local dev)
MAIL_PORT=1025
MAIL_USERNAME=noreply@interview-platform.com
NOTIFICATIONS_ENABLED=true
```

---

### Kafka UI (provectuslabs)

**What it does:** Web dashboard for viewing Kafka topics, messages, consumer groups, and lag.

**Default local credentials:**
```
Web UI: http://localhost:8086
Cluster: interview-platform
No authentication required (dev)
```

**Topics visible:**
- `notification-events` — legacy notification channel
- `interview-events` — interview lifecycle events
- `notification-bus` — unified multi-channel notification bus
- `search-index-events` — CQRS ES indexing triggers
- `email-dead-letter-queue` — failed email retries

---

### RedisInsight

**What it does:** Web dashboard for browsing Redis keys, monitoring rate limit counters, and cache inspection.

**Default local credentials:**
```
Web UI: http://localhost:5540
Redis Host: redis (Docker) / localhost (local)
Redis Port: 6379
No password (dev)
```

**What to look for:**
- `ratelimit:*` — rate limiting counters with TTL
- Cache entries managed by Spring Cache (`users::*`, `interviews::*`)

---

### Loki (Log Aggregation)

**What it does:** Aggregates application logs exported from OTel Collector. Queryable via Grafana.

**Default local credentials:**
```
API: http://localhost:3100
No authentication required (dev)
```

**Environment variables:**
```bash
# No app-level config needed. OTel Collector pushes to Loki automatically.
# Loki config is in otel-collector-config.yaml (loki exporter)
```

---

### Grafana (Dashboards)

**What it does:** Unified observability dashboard with pre-configured datasources for Prometheus, Loki, and Jaeger.

**Default local credentials:**
```
Web UI: http://localhost:3001
Username: admin
Password: admin
```

**Pre-configured datasources:**
- Prometheus (metrics) — `http://host.docker.internal:8889`
- Loki (logs) — `http://host.docker.internal:3100`
- Jaeger (traces) — `http://host.docker.internal:16686`

---

### Prometheus (Metrics)

**What it does:** Scrapes and stores time-series metrics from the OTel Collector and Node Exporter.

**Default local credentials:**
```
Web UI: http://localhost:9091
No authentication required
```

**What it scrapes:**
- OTel Collector metrics (port 8889) — JVM, HTTP, Kafka, Redis, DB metrics
- Node Exporter (port 9100) — Host CPU, memory, disk, network

---

## 15. Docker Compose Service Ports — Complete Reference

| Port | Service | Purpose |
|------|---------|---------|
| 1025 | Mailpit | SMTP (email capture) |
| 2181 | Zookeeper | Kafka coordination |
| 3001 | Grafana | Dashboards UI |
| 3100 | Loki | Log aggregation API |
| 4317 | OTel Collector | OTLP gRPC receiver |
| 4318 | OTel Collector | OTLP HTTP receiver |
| 4566 | LocalStack | S3-compatible API |
| 5433 | PostgreSQL | Database (mapped from 5432) |
| 5540 | RedisInsight | Redis browser UI |
| 6379 | Redis | Cache + rate limiting |
| 8025 | Mailpit | Email web UI |
| 8080 | Application | Backend API |
| 8086 | Kafka UI | Kafka dashboard |
| 8200 | Vault | Secret management |
| 8889 | OTel Collector | Prometheus metrics |
| 9090 | Keycloak | Identity provider |
| 9091 | Prometheus | Metrics UI |
| 9092 | Kafka | Message broker |
| 9100 | Node Exporter | Host metrics |
| 9200 | Elasticsearch | Search engine |
| 13133 | OTel Collector | Health check |
| 14250 | Jaeger | gRPC (trace ingest) |
| 16686 | Jaeger | Trace visualization UI |

---

## 16. Multi-Tenancy Credentials (Schema-Per-Tenant)

When `SCHEMA_PER_TENANT=true`, each organization gets its own PostgreSQL schema. The connection uses:

```bash
# Schema routing
SCHEMA_PER_TENANT=true

# HikariCP (optimized for multi-tenant)
HIKARI_MAX_POOL_SIZE=20
HIKARI_MIN_IDLE=5
# connection-init-sql resets search_path on pool return (prevents tenant data leaks)
```

**Important:** The `connection-init-sql: SET search_path TO public` in HikariCP config ensures connections returned to the pool don't retain a tenant's schema context.

---

## 17. External Services — Quick Credential Reference (All Integrations)

A consolidated reference for every external service the platform integrates with and where to obtain credentials.

| Service | Purpose | Credential Portal |
|---------|---------|-------------------|
| **OpenRouter** | AI services (25+ — summarizer, scoring, coaching, job descriptions, ML scoring, etc.) | [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) |
| **Google OAuth** | Social login, Calendar sync, Google Meet | [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) |
| **GitHub OAuth** | Social login, candidate sourcing | [github.com/settings/developers](https://github.com/settings/developers) |
| **Okta OIDC** | Primary enterprise SSO | [developer.okta.com](https://developer.okta.com) |
| **Twilio** | SMS notifications (interview reminders, OTP) | [console.twilio.com](https://console.twilio.com) |
| **Zoom** | Video meeting link generation | [marketplace.zoom.us](https://marketplace.zoom.us) |
| **Stripe** | International payments (Cards, SEPA, Apple Pay) | [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys) |
| **Razorpay** | Indian payments (UPI, Cards, NetBanking) | [dashboard.razorpay.com/app/keys](https://dashboard.razorpay.com/app/keys) |
| **Firebase** | Push notifications (Android/iOS via FCM) | [console.firebase.google.com](https://console.firebase.google.com) |
| **DocuSign** | E-signatures on offer letters | [developers.docusign.com](https://developers.docusign.com) |
| **Gmail / SendGrid** | Email delivery (SMTP) | [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) or [sendgrid.com](https://sendgrid.com) |
| **Slack** | Notifications, SlackBot integration | [api.slack.com/apps](https://api.slack.com/apps) |
| **Checkr** | Background checks (post-offer) | [dashboard.checkr.com](https://dashboard.checkr.com) |
| **Microsoft OAuth** | Social login, Outlook calendar sync | [portal.azure.com](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) |

### OpenRouter (AI Gateway — replaces direct OpenAI)

**Step-by-step setup:**

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up or log in
3. Go to **Settings > Keys** ([openrouter.ai/settings/keys](https://openrouter.ai/settings/keys))
4. Click **Create Key**
5. Name: `Interview Platform`
6. Copy the key (starts with `sk-or-`)

**Pricing:** Pay-per-use. Routes to cheapest available model. GPT-4o-mini via OpenRouter costs ~$0.15/1M input tokens.

**Environment variables:**
```bash
OPENAI_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
AI_SCORING_ENABLED=true
```

**Services using this key (25+):** AI Coach, Talent Matching, Screening Bot, Question Generator, AI Scoring, AI Summarizer, AI Job Description, Interview Coaching, ML Scoring, Real-time Translation, Competitive Intel, Nurturing, Interview Intelligence, Proctoring analysis, and more.

**Test:**
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer ${OPENAI_API_KEY}" | head -5
# Should return available models list
```
