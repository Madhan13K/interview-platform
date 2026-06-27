# CI/CD Pipeline Architecture

## Overview

This repository contains 15 GitHub Actions workflows that provide a comprehensive CI/CD pipeline covering continuous integration, deployment strategies, security scanning, performance testing, and operational automation.

```
                         ┌─────────────────────────────────────────────────────┐
                         │              TRIGGER EVENTS                          │
                         │  push(master) │ pull_request │ schedule │ dispatch   │
                         └───────┬───────┴──────┬───────┴────┬─────┴─────┬─────┘
                                 │              │            │           │
                    ┌────────────▼──┐    ┌──────▼─────┐     │    ┌──────▼──────┐
                    │   ci.yml      │    │  pr.yml    │     │    │  Manual     │
                    │ Master CI/CD  │    │ PR Tests   │     │    │  Dispatch   │
                    └──────┬────────┘    └────────────┘     │    └──────┬──────┘
                           │                                │           │
              ┌────────────┼────────────────┐               │           │
              │            │                │               │           │
    ┌─────────▼──┐  ┌──────▼─────┐  ┌──────▼──────┐       │    ┌──────▼──────────┐
    │ container- │  │ feature-   │  │ performance-│       │    │ blue-green-     │
    │ security   │  │ flag-sync  │  │ regression  │       │    │ deployment      │
    └────────────┘  └────────────┘  └─────────────┘       │    ├─────────────────┤
                                                          │    │ canary-         │
                                                          │    │ deployment      │
                                                          │    ├─────────────────┤
                                                          │    │ deploy-and-seed │
                                                          │    └────────┬────────┘
                                                          │             │
                         ┌────────────────────────────────┘             │
                         │                                              │
              ┌──────────▼──────────┐                    ┌─────────────▼─────────┐
              │  SCHEDULED JOBS     │                    │  POST-DEPLOY HOOKS     │
              ├─────────────────────┤                    ├────────────────────────┤
              │ chaos-engineering   │                    │ e2e-smoke-post-deploy  │
              │ dependency-audit    │                    │ deploy-notifications   │
              │ owasp-zap           │                    └────────────────────────┘
              │ secrets-rotation    │
              └─────────────────────┘

              ┌─────────────────────────────────────────┐
              │          PR-TRIGGERED JOBS               │
              ├─────────────────────────────────────────┤
              │ db-migration-validation (path-scoped)    │
              │ container-security (path-scoped)         │
              │ owasp-zap (path-scoped)                  │
              └─────────────────────────────────────────┘
```

---

## Workflow Summary Table

| # | Workflow File | Name | Trigger | Schedule | Purpose |
|---|---|---|---|---|---|
| 1 | `ci.yml` | Master CI/CD Pipeline | push to `master` | - | Full build, test, Docker publish on master merge |
| 2 | `pr.yml` | PR Tests Pipeline | pull_request to `master` | - | Run all tests on PRs before merge |
| 3 | `blue-green-deployment.yml` | Blue-Green Deployment | workflow_dispatch | - | Zero-downtime production deployment with traffic switching |
| 4 | `canary-deployment.yml` | Canary Deployment | workflow_dispatch | - | Gradual traffic shifting (5%→25%→50%→100%) with auto-rollback |
| 5 | `deploy-and-seed.yml` | Deploy & Seed Test Data | workflow_dispatch | - | Deploy to environment and optionally seed test data |
| 6 | `deploy-notifications.yml` | Deployment Notifications | workflow_run (after deploy) | - | Slack/email notifications on deployment completion |
| 7 | `e2e-smoke-post-deploy.yml` | E2E Smoke Tests (Post-Deploy) | workflow_run (after deploy) | - | Automated smoke tests after production deployments |
| 8 | `container-security.yml` | Container Security Scan | push/PR (Dockerfile/pom.xml) | - | Trivy/Grype scanning of Docker images |
| 9 | `owasp-zap.yml` | OWASP ZAP Security Scan (DAST) | PR, push, schedule | Weekly Monday 2AM UTC | Dynamic application security testing |
| 10 | `dependency-audit.yml` | Dependency Security Audit | schedule, dispatch | Weekly Wednesday 6AM UTC | OWASP Dependency-Check for known CVEs |
| 11 | `secrets-rotation.yml` | Secrets Rotation | schedule, dispatch | Monthly 1st day 4AM UTC | Automated rotation of JWT keys, API keys, DB passwords |
| 12 | `chaos-engineering.yml` | Chaos Engineering Tests | schedule, dispatch | Weekly Friday 3AM UTC | Resilience testing via pod-kill, latency injection, stress |
| 13 | `performance-regression.yml` | Performance Regression Tests | push to `master`, dispatch | - | k6 load testing to catch performance regressions |
| 14 | `feature-flag-sync.yml` | Feature Flag Sync | push (feature-flag paths) | - | Sync feature flags between code and remote provider |
| 15 | `db-migration-validation.yml` | Database Migration Validation | PR (migration paths) | - | Validate Flyway migrations against test database |

---

## Workflow Details

### 1. Master CI/CD Pipeline (`ci.yml`)

**Trigger:** `push` to `master` branch

**Stages:**
1. Backend Build & Unit Tests (Java 21, PostgreSQL 16, Redis 7)
2. Frontend Build & Tests (Node 22)
3. Integration Tests
4. Docker Image Build & Push to GHCR
5. Deploy to staging

**Services Required:** PostgreSQL 16, Redis 7

**Key Environment Variables:**
- `JAVA_VERSION: '21'`
- `NODE_VERSION: '22'`
- `DOCKER_REGISTRY: ghcr.io`

---

### 2. PR Tests Pipeline (`pr.yml`)

**Trigger:** `pull_request` targeting `master`

Runs the same test suite as `ci.yml` without the deployment stage. Ensures all PRs pass before merge.

---

### 3. Blue-Green Deployment (`blue-green-deployment.yml`)

**Trigger:** `workflow_dispatch` (manual)

**Inputs:**
- `image_tag` (required) - Docker image tag to deploy
- `environment` (choice: staging/production)

**Strategy:** Deploys new version to "green" environment, runs health checks, then switches traffic from "blue" to "green". Maintains rollback capability by keeping blue alive.

**Namespace:** `interview-platform`

---

### 4. Canary Deployment (`canary-deployment.yml`)

**Trigger:** `workflow_dispatch` (manual)

**Inputs:**
- `environment` (choice: staging/production)
- `canary_weight` (default: 5%) - Initial traffic percentage
- `image_tag` (required)

**Strategy:** Gradually increases traffic to the new version while monitoring error rates. Auto-rollback if metrics exceed thresholds.

---

### 5. Deploy & Seed Test Data (`deploy-and-seed.yml`)

**Trigger:** `workflow_dispatch` (manual)

**Inputs:**
- `environment` (choice: staging/production)
- `seed_data` (boolean, default: true)

Used for staging deployments where test data seeding is needed for QA.

---

### 6. Deployment Notifications (`deploy-notifications.yml`)

**Trigger:** `workflow_run` - runs after Blue-Green, Canary, or CI/CD Pipeline completes

Sends Slack notifications with:
- Deployment status (success/failure)
- Last 5 commits (changelog)
- Environment and duration details

---

### 7. E2E Smoke Tests (`e2e-smoke-post-deploy.yml`)

**Trigger:** `workflow_run` - runs after Blue-Green or Canary deployment

**Also:** `workflow_dispatch` with custom `target_url`

Runs critical path smoke tests against the deployed environment to verify core functionality.

**Default Target:** `https://app.interview-platform.com`

---

### 8. Container Security Scan (`container-security.yml`)

**Trigger:** Push/PR modifying `Dockerfile` or `pom.xml`

Builds the Docker image and runs vulnerability scanners (Trivy, Grype) to detect CVEs in base images and dependencies.

---

### 9. OWASP ZAP Security Scan (`owasp-zap.yml`)

**Trigger:** PR to master (src changes), push to master, weekly schedule

**Schedule:** `0 2 * * 1` (Monday 2AM UTC)

Performs Dynamic Application Security Testing (DAST) against a running instance. Uses custom rules from `.github/zap/rules.tsv`.

---

### 10. Dependency Security Audit (`dependency-audit.yml`)

**Trigger:** Weekly schedule + manual dispatch

**Schedule:** `0 6 * * 3` (Wednesday 6AM UTC)

Runs OWASP Dependency-Check on Maven (backend) and npm (frontend) dependencies to identify known CVEs.

---

### 11. Secrets Rotation (`secrets-rotation.yml`)

**Trigger:** Monthly schedule + manual dispatch

**Schedule:** `0 4 1 * *` (1st of month, 4AM UTC)

**Inputs (manual):** Rotate jwt-keys, api-keys, db-passwords, or all

Integrates with HashiCorp Vault for automated credential rotation.

---

### 12. Chaos Engineering Tests (`chaos-engineering.yml`)

**Trigger:** Weekly schedule + manual dispatch

**Schedule:** `0 3 * * 5` (Friday 3AM UTC - low traffic)

**Experiments:**
- `pod-kill` - Random pod termination
- `network-latency` - Inject network delays
- `cpu-stress` - CPU saturation testing
- `memory-stress` - Memory pressure testing
- `disk-fill` - Disk capacity testing
- `all` - Run all experiments

---

### 13. Performance Regression Tests (`performance-regression.yml`)

**Trigger:** Push to master + manual dispatch

**Inputs (manual):**
- `duration` (default: 30s)
- `vus` - Virtual users (default: 10)

Runs k6 load tests and compares results against baseline thresholds.

---

### 14. Feature Flag Sync (`feature-flag-sync.yml`)

**Trigger:** Push to master modifying feature flag files

**Path Filters:**
- `**/featureflags/**`
- `src/main/resources/feature-flags.yml`

**Actions:** sync-to-provider, sync-from-provider, audit

---

### 15. Database Migration Validation (`db-migration-validation.yml`)

**Trigger:** PR modifying `db/migration/**` files

Spins up a test PostgreSQL 16 instance and validates all Flyway migrations can be applied cleanly, including rollback testing.

---

## Required Secrets

| Secret | Used By | Purpose |
|--------|---------|---------|
| `GITHUB_TOKEN` | ci, pr, container-security | GHCR push, PR comments |
| `SLACK_WEBHOOK_URL` | deploy-notifications | Slack integration |
| `SMOKE_TEST_PASSWORD` | e2e-smoke-post-deploy | Admin test account |
| `VAULT_ADDR` | secrets-rotation | HashiCorp Vault address |
| `VAULT_TOKEN` | secrets-rotation | Vault authentication |
| `KUBECONFIG` | blue-green, canary, deploy-and-seed | Kubernetes cluster access |
| `SONAR_TOKEN` | ci, pr | SonarQube code analysis |
| `SNYK_TOKEN` | dependency-audit | Snyk vulnerability scanning |
| `DATADOG_API_KEY` | canary-deployment | Metrics monitoring |
| `OPENROUTER_API_KEY` | Application runtime | AI/LLM API access |

---

## Required Environment Variables

| Variable | Default | Workflows | Purpose |
|----------|---------|-----------|---------|
| `JAVA_VERSION` | `21` | ci, pr | JDK version |
| `NODE_VERSION` | `22` | ci, pr | Node.js version |
| `DOCKER_REGISTRY` | `ghcr.io` | ci, container-security | Container registry |
| `NAMESPACE` | `interview-platform` | blue-green, canary | K8s namespace |
| `TARGET_URL` | `http://localhost:8080` | owasp-zap, performance | Test target |

---

## Workflow Dependencies

```
ci.yml (master push)
  ├── triggers: deploy-notifications.yml (on completion)
  └── parallel: container-security.yml, performance-regression.yml, feature-flag-sync.yml

blue-green-deployment.yml (manual)
  ├── triggers: e2e-smoke-post-deploy.yml (on completion)
  └── triggers: deploy-notifications.yml (on completion)

canary-deployment.yml (manual)
  ├── triggers: e2e-smoke-post-deploy.yml (on completion)
  └── triggers: deploy-notifications.yml (on completion)

pr.yml (pull request)
  ├── parallel: db-migration-validation.yml (if migration paths changed)
  ├── parallel: container-security.yml (if Dockerfile/pom.xml changed)
  └── parallel: owasp-zap.yml (if src paths changed)
```

---

## Enabling/Disabling Workflows

### Disable a workflow via GitHub UI:
1. Navigate to **Actions** tab
2. Select the workflow from the left sidebar
3. Click the `...` menu → **Disable workflow**

### Disable via file:
Add the workflow file to `.github/workflows-disabled/` (rename from `.yml` to `.yml.disabled`).

### Conditional skip with paths:
Workflows with `paths` filters only run when relevant files change. To prevent a workflow from running on certain commits, ensure your changes don't touch the filtered paths.

### Skip all workflows for a commit:
Add `[skip ci]` or `[ci skip]` to your commit message.

### Environment-specific control:
Deployment workflows use GitHub Environments with protection rules:
- **staging**: No approval required
- **production**: Requires 1 reviewer approval + wait timer

---

## Troubleshooting

### Common Issues

#### 1. CI pipeline fails on PostgreSQL connection
```
Error: Connection refused to localhost:5432
```
**Fix:** The PostgreSQL service container may not be ready. The workflow uses `--health-cmd pg_isready` with retries. If persistent, increase `--health-retries` from 5 to 10.

#### 2. Docker push to GHCR fails with 403
```
Error: denied: permission_denied
```
**Fix:** Ensure the repository's package settings allow GitHub Actions to push. Go to Settings → Actions → General → Workflow permissions → Read and write permissions.

#### 3. Blue-Green deployment stuck on health check
```
Error: Health check timeout after 300s
```
**Fix:** Verify the application's `/actuator/health` endpoint is accessible within the cluster. Check:
- Service selector labels match pod labels
- Readiness probe configuration in deployment manifest
- Network policies allow ingress on the health port

#### 4. Canary deployment auto-rollback triggered
```
Info: Error rate exceeded threshold, rolling back
```
**Investigation:** Check Datadog/metrics dashboard for the error spike. Common causes:
- Database schema incompatibility between versions
- Missing environment variables in new version
- Dependency service outage (unrelated)

#### 5. OWASP ZAP scan reports false positives
**Fix:** Add exceptions to `.github/zap/rules.tsv`:
```
10038	IGNORE	(Content Security Policy header false positive)
10049	IGNORE	(Storable and Cacheable Content)
```

#### 6. Secrets rotation fails with Vault 403
```
Error: permission denied on vault path
```
**Fix:** Verify the Vault token has not expired and has the correct policies:
```bash
vault token lookup
vault policy read ci-rotation-policy
```

#### 7. Performance regression test baseline mismatch
**Fix:** After intentional performance changes, update baselines:
1. Run the workflow manually with the new expected thresholds
2. Update the k6 threshold configuration in the test scripts
3. Commit the updated baseline file

#### 8. Feature flag sync conflict
```
Error: Remote flags differ from local definition
```
**Fix:** Run with `sync-from-provider` action first to pull remote state, resolve conflicts locally, then push with `sync-to-provider`.

#### 9. DB migration validation fails on PR
```
Error: Migration checksum mismatch
```
**Fix:** Never modify an already-applied migration. Create a new migration file instead. If in development, use `flyway repair` locally.

#### 10. Chaos engineering causes production incident
**Safeguards in place:**
- Scheduled during lowest traffic (Friday 3AM UTC)
- Runs only in staging by default (dispatch allows production override)
- Each experiment has a blast radius limit
- Auto-recovery mechanisms are tested as part of the experiment

---

## Adding a New Workflow

1. Create `.github/workflows/your-workflow.yml`
2. Define trigger conditions (`on:`)
3. Add required secrets to repository settings
4. If environment-specific, create the environment in Settings → Environments
5. Update this README with the new workflow details
6. Test with `workflow_dispatch` before enabling automatic triggers

---

## Architecture Principles

- **Fail-fast:** PR workflows run quick checks first (lint, compile) before expensive operations (integration tests)
- **Isolation:** Each workflow uses its own service containers; no shared state between runs
- **Idempotency:** All deployment workflows can be safely re-run without side effects
- **Observability:** Every workflow emits status to Slack and GitHub commit status checks
- **Security-first:** Secrets never logged; container images scanned before deployment; DAST runs weekly
- **Cost-conscious:** Scheduled jobs run during off-peak; caching (Maven, npm, Docker layers) reduces build time by ~60%
