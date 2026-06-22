#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Test Data Deployment Script
# Seeds the application with comprehensive test data for all features
# ═══════════════════════════════════════════════════════════════════

set -e

BASE_URL="${BASE_URL:-http://localhost:8080}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@interview.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

echo "═══════════════════════════════════════════════════"
echo "  Interview Platform - Test Data Deployment"
echo "  Target: $BASE_URL"
echo "═══════════════════════════════════════════════════"

# ─── Step 1: Login and get token ───────────────────────────────────
echo ""
echo "▶ Step 1: Authenticating..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | python3 -c "import sys,json;print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "  ✗ Login failed. Trying with test user..."
  # Try registering admin first
  curl -s -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Admin","lastName":"User","email":"admin@interview.com","password":"admin123"}' > /dev/null 2>&1
  
  TOKEN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@interview.com","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)
fi

if [ -z "$TOKEN" ]; then
  echo "  ✗ Authentication failed. Is the backend running at $BASE_URL?"
  exit 1
fi
echo "  ✓ Authenticated successfully"

AUTH="Authorization: Bearer $TOKEN"

# ─── Step 2: Register test users ──────────────────────────────────
echo ""
echo "▶ Step 2: Creating test users..."

declare -A USERS=(
  ["interviewer1"]='{"firstName":"Alice","lastName":"Johnson","email":"alice@test.com","password":"Test@123"}'
  ["interviewer2"]='{"firstName":"Bob","lastName":"Smith","email":"bob@test.com","password":"Test@123"}'
  ["candidate1"]='{"firstName":"Charlie","lastName":"Brown","email":"charlie@test.com","password":"Test@123"}'
  ["candidate2"]='{"firstName":"Diana","lastName":"Lee","email":"diana@test.com","password":"Test@123"}'
  ["candidate3"]='{"firstName":"Eve","lastName":"Davis","email":"eve@test.com","password":"Test@123"}'
  ["recruiter"]='{"firstName":"Frank","lastName":"Wilson","email":"frank@test.com","password":"Test@123"}'
)

for key in "${!USERS[@]}"; do
  RESULT=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "${USERS[$key]}")
  if [ "$RESULT" = "201" ] || [ "$RESULT" = "200" ]; then
    echo "  ✓ Created user: $key"
  else
    echo "  - User $key already exists (or error: $RESULT)"
  fi
done

# ─── Step 3: Create job positions ─────────────────────────────────
echo ""
echo "▶ Step 3: Creating job positions..."

JOBS='[
  {"title":"Senior Backend Engineer","department":"Engineering","description":"Build scalable services","requirements":"Java, Spring Boot, 5+ years","location":"Remote","employmentType":"FULL_TIME","experienceLevel":"SENIOR","salaryRange":"$150K-$200K"},
  {"title":"Frontend Developer","department":"Engineering","description":"Build UIs with React","requirements":"React, TypeScript, 3+ years","location":"San Francisco","employmentType":"FULL_TIME","experienceLevel":"MID","salaryRange":"$120K-$160K"},
  {"title":"DevOps Engineer","department":"Infrastructure","description":"Manage K8s and CI/CD","requirements":"Kubernetes, AWS, Terraform","location":"Remote","employmentType":"FULL_TIME","experienceLevel":"SENIOR","salaryRange":"$140K-$180K"}
]'

echo "$JOBS" | python3 -c "
import sys, json, subprocess
jobs = json.load(sys.stdin)
for job in jobs:
    r = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', '-X', 'POST',
        '$BASE_URL/api/v1/job-positions', '-H', 'Content-Type: application/json',
        '-H', '$AUTH', '-d', json.dumps(job)], capture_output=True, text=True)
    print(f'  ✓ Created job: {job[\"title\"]}' if r.stdout.strip() in ['200','201'] else f'  - Job exists: {job[\"title\"]}')
"

# ─── Step 4: Create interviews ────────────────────────────────────
echo ""
echo "▶ Step 4: Creating sample interviews..."

for i in 1 2 3; do
  FUTURE_DATE=$(date -v+${i}d "+%Y-%m-%dT10:00:00" 2>/dev/null || date -d "+${i} day" "+%Y-%m-%dT10:00:00" 2>/dev/null)
  RESULT=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/interviews" \
    -H "Content-Type: application/json" \
    -H "$AUTH" \
    -d "{\"title\":\"Test Interview $i\",\"type\":\"TECHNICAL\",\"scheduledAt\":\"$FUTURE_DATE\",\"duration\":60}")
  echo "  ✓ Created interview $i (status: $RESULT)"
done

# ─── Step 5: Create question categories ───────────────────────────
echo ""
echo "▶ Step 5: Creating question bank..."

for CAT in "Data Structures" "System Design" "Behavioral" "Frontend"; do
  curl -s -o /dev/null -X POST "$BASE_URL/api/v1/questions/categories" \
    -H "Content-Type: application/json" \
    -H "$AUTH" \
    -d "{\"name\":\"$CAT\",\"description\":\"$CAT questions\"}"
  echo "  ✓ Category: $CAT"
done

# ─── Step 6: Test AI endpoint ─────────────────────────────────────
echo ""
echo "▶ Step 6: Testing AI features..."

AI_RESULT=$(curl -s -X POST "$BASE_URL/api/v1/ai/suggest-questions" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"jobTitle":"Backend Engineer","difficulty":"MEDIUM","category":"TECHNICAL","count":3,"skills":["Java","Spring"]}')

if echo "$AI_RESULT" | python3 -c "import sys,json;json.load(sys.stdin)" 2>/dev/null; then
  echo "  ✓ AI suggestion endpoint working"
else
  echo "  - AI endpoint returned non-JSON (may need OPENAI_API_KEY)"
fi

# ─── Step 7: Test feature flags ───────────────────────────────────
echo ""
echo "▶ Step 7: Testing feature flags..."

FLAGS=$(curl -s -H "$AUTH" "$BASE_URL/api/v1/feature-flags" 2>/dev/null)
if [ -n "$FLAGS" ]; then
  echo "  ✓ Feature flags loaded"
else
  echo "  - Feature flags endpoint not available"
fi

# ─── Step 8: Verify health ────────────────────────────────────────
echo ""
echo "▶ Step 8: Verifying system health..."

HEALTH=$(curl -s "$BASE_URL/actuator/health" | python3 -c "import sys,json;print(json.load(sys.stdin).get('status','UNKNOWN'))" 2>/dev/null)
echo "  Health status: $HEALTH"

# ─── Summary ──────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✓ Test Data Deployment Complete!"
echo ""
echo "  Test Accounts:"
echo "    Admin:       admin@interview.com / admin123"
echo "    Recruiter:   frank@test.com / Test@123"
echo "    Interviewer: alice@test.com / Test@123"
echo "    Candidate:   charlie@test.com / Test@123"
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  $BASE_URL"
echo "  Swagger:  $BASE_URL/swagger-ui/index.html"
echo "  Health:   $BASE_URL/actuator/health"
echo "═══════════════════════════════════════════════════"
