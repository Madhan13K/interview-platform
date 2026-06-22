#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# API Integration Test Script
# Tests all major CRUD endpoints with cleanup
# ═══════════════════════════════════════════════════════════════════════════════

set -o pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
BASE_URL="${BASE_URL:-http://localhost:8080}"
TEST_PREFIX="CI_TEST_"
TIMESTAMP=$(date +%s)
TEST_EMAIL="${TEST_PREFIX}user_${TIMESTAMP}@test.com"
TEST_PASSWORD="TestPass@123"
TEST_FIRST_NAME="${TEST_PREFIX}John"
TEST_LAST_NAME="${TEST_PREFIX}Doe"

# Counters
TOTAL=0
PASSED=0
FAILED=0

# Captured IDs for cleanup
TOKEN=""
USER_ID=""
JOB_POSITION_ID=""
INTERVIEW_ID=""
QUESTION_ID=""
CATEGORY_ID=""
TEMPLATE_ID=""

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ─── Helper Functions ─────────────────────────────────────────────────────────

print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
}

print_section() {
    echo ""
    echo -e "${YELLOW}▶ $1${NC}"
}

assert_status() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    TOTAL=$((TOTAL + 1))

    if [ "$actual" = "$expected" ]; then
        PASSED=$((PASSED + 1))
        echo -e "  ${GREEN}✓ PASS${NC} - $test_name (HTTP $actual)"
    else
        FAILED=$((FAILED + 1))
        echo -e "  ${RED}✗ FAIL${NC} - $test_name (expected HTTP $expected, got HTTP $actual)"
    fi
}

assert_status_one_of() {
    local test_name="$1"
    shift
    local actual="${!#}"  # last argument
    local expected_codes=("${@:1:$#-1}")
    TOTAL=$((TOTAL + 1))

    for code in "${expected_codes[@]}"; do
        if [ "$actual" = "$code" ]; then
            PASSED=$((PASSED + 1))
            echo -e "  ${GREEN}✓ PASS${NC} - $test_name (HTTP $actual)"
            return
        fi
    done

    FAILED=$((FAILED + 1))
    echo -e "  ${RED}✗ FAIL${NC} - $test_name (expected one of [${expected_codes[*]}], got HTTP $actual)"
}

assert_not_empty() {
    local test_name="$1"
    local value="$2"
    TOTAL=$((TOTAL + 1))

    if [ -n "$value" ] && [ "$value" != "null" ] && [ "$value" != "" ]; then
        PASSED=$((PASSED + 1))
        echo -e "  ${GREEN}✓ PASS${NC} - $test_name (value present)"
    else
        FAILED=$((FAILED + 1))
        echo -e "  ${RED}✗ FAIL${NC} - $test_name (value is empty or null)"
    fi
}

# Extract JSON field using python3 (available on most systems)
json_field() {
    local json="$1"
    local field="$2"
    echo "$json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    val = data.get('$field', '')
    print(val if val is not None else '')
except:
    print('')
" 2>/dev/null
}

# ─── Pre-flight Check ─────────────────────────────────────────────────────────
print_header "API Integration Tests"
echo "  Target:     $BASE_URL"
echo "  Test User:  $TEST_EMAIL"
echo "  Timestamp:  $TIMESTAMP"
echo ""
echo "Checking if server is reachable..."

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$BASE_URL/actuator/health" 2>/dev/null)
if [ "$HEALTH_STATUS" != "200" ]; then
    echo -e "${RED}ERROR: Server at $BASE_URL is not reachable (HTTP $HEALTH_STATUS)${NC}"
    echo "Make sure the backend is running before executing tests."
    exit 1
fi
echo -e "${GREEN}Server is up and healthy.${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# AUTH TESTS
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Auth: Register a new test user"

REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"firstName\": \"$TEST_FIRST_NAME\",
        \"lastName\": \"$TEST_LAST_NAME\",
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

REGISTER_BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')
REGISTER_STATUS=$(echo "$REGISTER_RESPONSE" | tail -1)
assert_status "Register new user" "201" "$REGISTER_STATUS"

# ─── Login ────────────────────────────────────────────────────────────────────
print_section "Auth: Login with test user"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')
LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -1)
assert_status "Login with test user" "200" "$LOGIN_STATUS"

TOKEN=$(json_field "$LOGIN_BODY" "accessToken")
USER_ID=$(json_field "$LOGIN_BODY" "userId")
assert_not_empty "Token received" "$TOKEN"

if [ -z "$TOKEN" ]; then
    echo -e "${RED}FATAL: Cannot proceed without auth token. Aborting.${NC}"
    exit 1
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

# ─── Get /users/me ────────────────────────────────────────────────────────────
print_section "Auth: Get current user profile"

ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/v1/users/me" \
    -H "$AUTH_HEADER")

ME_BODY=$(echo "$ME_RESPONSE" | sed '$d')
ME_STATUS=$(echo "$ME_RESPONSE" | tail -1)
assert_status "GET /users/me" "200" "$ME_STATUS"

ME_EMAIL=$(json_field "$ME_BODY" "email")
assert_not_empty "Profile email returned" "$ME_EMAIL"

# ═══════════════════════════════════════════════════════════════════════════════
# We need ADMIN/RECRUITER token for most operations. Register as interviewer
# to get enough permissions, or try to use admin credentials.
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Auth: Obtain admin/recruiter token for privileged operations"

# Try logging in as admin
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@interview.com}"
ADMIN_PASSWORD_ENV="${ADMIN_PASSWORD:-admin123}"

ADMIN_LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$ADMIN_EMAIL\",
        \"password\": \"$ADMIN_PASSWORD_ENV\"
    }")

ADMIN_LOGIN_BODY=$(echo "$ADMIN_LOGIN_RESPONSE" | sed '$d')
ADMIN_LOGIN_STATUS=$(echo "$ADMIN_LOGIN_RESPONSE" | tail -1)

ADMIN_TOKEN=$(json_field "$ADMIN_LOGIN_BODY" "accessToken")

if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "" ]; then
    echo -e "  ${GREEN}✓${NC} Admin token obtained"
    AUTH_HEADER="Authorization: Bearer $ADMIN_TOKEN"
else
    echo -e "  ${YELLOW}! Using test user token (some tests may fail due to permissions)${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# JOB POSITIONS TESTS
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Job Positions: Create"

CREATE_JP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/job-positions" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{
        \"title\": \"${TEST_PREFIX}Senior Backend Engineer\",
        \"department\": \"${TEST_PREFIX}Engineering\",
        \"location\": \"Remote\",
        \"employmentType\": \"FULL_TIME\",
        \"experienceLevel\": \"SENIOR\",
        \"description\": \"CI test job position\",
        \"requirements\": \"Java, Spring Boot\",
        \"numberOfOpenings\": 1
    }")

CREATE_JP_BODY=$(echo "$CREATE_JP_RESPONSE" | sed '$d')
CREATE_JP_STATUS=$(echo "$CREATE_JP_RESPONSE" | tail -1)
assert_status "Create job position" "201" "$CREATE_JP_STATUS"

JOB_POSITION_ID=$(json_field "$CREATE_JP_BODY" "id")
assert_not_empty "Job position ID captured" "$JOB_POSITION_ID"

# ─── Get job position by ID ──────────────────────────────────────────────────
print_section "Job Positions: Get by ID"

GET_JP_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/v1/job-positions/$JOB_POSITION_ID" \
    -H "$AUTH_HEADER")

GET_JP_STATUS=$(echo "$GET_JP_RESPONSE" | tail -1)
assert_status "Get job position by ID" "200" "$GET_JP_STATUS"

# ─── Update job position ─────────────────────────────────────────────────────
print_section "Job Positions: Update"

UPDATE_JP_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/v1/job-positions/$JOB_POSITION_ID" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{
        \"title\": \"${TEST_PREFIX}Senior Backend Engineer (Updated)\",
        \"department\": \"${TEST_PREFIX}Engineering\",
        \"location\": \"Hybrid\",
        \"employmentType\": \"FULL_TIME\",
        \"experienceLevel\": \"SENIOR\",
        \"description\": \"Updated CI test job position\",
        \"requirements\": \"Java, Spring Boot, Kubernetes\"
    }")

UPDATE_JP_STATUS=$(echo "$UPDATE_JP_RESPONSE" | tail -1)
assert_status "Update job position" "200" "$UPDATE_JP_STATUS"

# ─── List all job positions ──────────────────────────────────────────────────
print_section "Job Positions: List all"

LIST_JP_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/v1/job-positions" \
    -H "$AUTH_HEADER")

LIST_JP_STATUS=$(echo "$LIST_JP_RESPONSE" | tail -1)
assert_status "List all job positions" "200" "$LIST_JP_STATUS"

# ═══════════════════════════════════════════════════════════════════════════════
# INTERVIEWS TESTS
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Interviews: Create"

# We need a candidate ID and interviewer ID - use the test user as candidate
CANDIDATE_ID="$USER_ID"
if [ -z "$CANDIDATE_ID" ] || [ "$CANDIDATE_ID" = "null" ]; then
    # Try to extract from /users/me
    CANDIDATE_ID=$(json_field "$ME_BODY" "id")
fi

# Future timestamps
START_TIME=$(date -u -v+2d "+%Y-%m-%dT10:00:00Z" 2>/dev/null || date -u -d "+2 days" "+%Y-%m-%dT10:00:00Z" 2>/dev/null)
END_TIME=$(date -u -v+2d "+%Y-%m-%dT11:00:00Z" 2>/dev/null || date -u -d "+2 days" "+%Y-%m-%dT11:00:00Z" 2>/dev/null)

CREATE_IV_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/interviews" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{
        \"title\": \"${TEST_PREFIX}Technical Interview\",
        \"description\": \"CI test interview\",
        \"candidateId\": \"$CANDIDATE_ID\",
        \"startTime\": \"$START_TIME\",
        \"endTime\": \"$END_TIME\",
        \"timeZone\": \"UTC\",
        \"type\": \"TECHNICAL\",
        \"mode\": \"VIRTUAL\",
        \"meetingLink\": \"https://meet.test.com/ci-test\",
        \"interviewerIds\": [\"$CANDIDATE_ID\"]
    }")

CREATE_IV_BODY=$(echo "$CREATE_IV_RESPONSE" | sed '$d')
CREATE_IV_STATUS=$(echo "$CREATE_IV_RESPONSE" | tail -1)
assert_status "Create interview" "201" "$CREATE_IV_STATUS"

INTERVIEW_ID=$(json_field "$CREATE_IV_BODY" "id")
assert_not_empty "Interview ID captured" "$INTERVIEW_ID"

# ─── Get interview by ID ─────────────────────────────────────────────────────
print_section "Interviews: Get by ID"

if [ -n "$INTERVIEW_ID" ] && [ "$INTERVIEW_ID" != "null" ]; then
    GET_IV_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/v1/interviews/$INTERVIEW_ID" \
        -H "$AUTH_HEADER")

    GET_IV_STATUS=$(echo "$GET_IV_RESPONSE" | tail -1)
    assert_status "Get interview by ID" "200" "$GET_IV_STATUS"
else
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
    echo -e "  ${RED}✗ FAIL${NC} - Get interview by ID (no interview ID available)"
fi

# ─── Update interview ────────────────────────────────────────────────────────
print_section "Interviews: Update"

if [ -n "$INTERVIEW_ID" ] && [ "$INTERVIEW_ID" != "null" ]; then
    UPDATE_IV_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/v1/interviews/$INTERVIEW_ID" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d "{
            \"title\": \"${TEST_PREFIX}Technical Interview (Updated)\",
            \"description\": \"Updated CI test interview\"
        }")

    UPDATE_IV_STATUS=$(echo "$UPDATE_IV_RESPONSE" | tail -1)
    assert_status "Update interview" "200" "$UPDATE_IV_STATUS"
else
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
    echo -e "  ${RED}✗ FAIL${NC} - Update interview (no interview ID available)"
fi

# ─── List interviews ─────────────────────────────────────────────────────────
print_section "Interviews: List all"

LIST_IV_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/v1/interviews" \
    -H "$AUTH_HEADER")

LIST_IV_STATUS=$(echo "$LIST_IV_RESPONSE" | tail -1)
assert_status "List all interviews" "200" "$LIST_IV_STATUS"

# ═══════════════════════════════════════════════════════════════════════════════
# QUESTIONS TESTS
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Questions: Create category"

CREATE_CAT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/questions/categories" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{
        \"name\": \"${TEST_PREFIX}Algorithms_${TIMESTAMP}\",
        \"description\": \"CI test category for algorithm questions\"
    }")

CREATE_CAT_BODY=$(echo "$CREATE_CAT_RESPONSE" | sed '$d')
CREATE_CAT_STATUS=$(echo "$CREATE_CAT_RESPONSE" | tail -1)
assert_status_one_of "Create question category" "200" "201" "$CREATE_CAT_STATUS"

CATEGORY_ID=$(json_field "$CREATE_CAT_BODY" "id")
assert_not_empty "Category ID captured" "$CATEGORY_ID"

# ─── Create question ─────────────────────────────────────────────────────────
print_section "Questions: Create question"

if [ -n "$CATEGORY_ID" ] && [ "$CATEGORY_ID" != "null" ]; then
    CREATE_Q_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/questions" \
        -H "Content-Type: application/json" \
        -H "$AUTH_HEADER" \
        -d "{
            \"title\": \"${TEST_PREFIX}Implement a Binary Search Tree\",
            \"description\": \"Write a BST implementation with insert, delete, and search operations\",
            \"categoryId\": \"$CATEGORY_ID\",
            \"difficulty\": \"MEDIUM\",
            \"type\": \"CODING\",
            \"expectedDurationMinutes\": 30,
            \"sampleAnswer\": \"Use recursive approach...\",
            \"tags\": \"algorithms,trees,data-structures\"
        }")

    CREATE_Q_BODY=$(echo "$CREATE_Q_RESPONSE" | sed '$d')
    CREATE_Q_STATUS=$(echo "$CREATE_Q_RESPONSE" | tail -1)
    assert_status "Create question" "201" "$CREATE_Q_STATUS"

    QUESTION_ID=$(json_field "$CREATE_Q_BODY" "id")
    assert_not_empty "Question ID captured" "$QUESTION_ID"
else
    TOTAL=$((TOTAL + 2))
    FAILED=$((FAILED + 2))
    echo -e "  ${RED}✗ FAIL${NC} - Create question (no category ID available)"
fi

# ─── Search questions ─────────────────────────────────────────────────────────
print_section "Questions: Search"

SEARCH_Q_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/v1/questions/search?keyword=${TEST_PREFIX}" \
    -H "$AUTH_HEADER")

SEARCH_Q_STATUS=$(echo "$SEARCH_Q_RESPONSE" | tail -1)
assert_status "Search questions" "200" "$SEARCH_Q_STATUS"

# ─── Get question by ID ──────────────────────────────────────────────────────
print_section "Questions: Get by ID"

if [ -n "$QUESTION_ID" ] && [ "$QUESTION_ID" != "null" ]; then
    GET_Q_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/v1/questions/$QUESTION_ID" \
        -H "$AUTH_HEADER")

    GET_Q_STATUS=$(echo "$GET_Q_RESPONSE" | tail -1)
    assert_status "Get question by ID" "200" "$GET_Q_STATUS"
else
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
    echo -e "  ${RED}✗ FAIL${NC} - Get question by ID (no question ID available)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# TEMPLATES TESTS
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Templates: Create"

CREATE_TPL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v1/templates" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{
        \"title\": \"${TEST_PREFIX}Technical Screen Template\",
        \"description\": \"CI test template for technical screening\",
        \"type\": \"TECHNICAL\",
        \"mode\": \"VIRTUAL\",
        \"durationMinutes\": 60,
        \"evaluationCriteria\": \"Problem solving, code quality, communication\",
        \"instructions\": \"Start with easy warmup, then move to medium difficulty\",
        \"tags\": \"technical,screening,ci-test\"
    }")

CREATE_TPL_BODY=$(echo "$CREATE_TPL_RESPONSE" | sed '$d')
CREATE_TPL_STATUS=$(echo "$CREATE_TPL_RESPONSE" | tail -1)
assert_status "Create template" "201" "$CREATE_TPL_STATUS"

TEMPLATE_ID=$(json_field "$CREATE_TPL_BODY" "id")
assert_not_empty "Template ID captured" "$TEMPLATE_ID"

# ─── Get template by ID ──────────────────────────────────────────────────────
print_section "Templates: Get by ID"

if [ -n "$TEMPLATE_ID" ] && [ "$TEMPLATE_ID" != "null" ]; then
    GET_TPL_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/v1/templates/$TEMPLATE_ID" \
        -H "$AUTH_HEADER")

    GET_TPL_STATUS=$(echo "$GET_TPL_RESPONSE" | tail -1)
    assert_status "Get template by ID" "200" "$GET_TPL_STATUS"
else
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
    echo -e "  ${RED}✗ FAIL${NC} - Get template by ID (no template ID available)"
fi

# ─── List templates ──────────────────────────────────────────────────────────
print_section "Templates: List all"

LIST_TPL_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/v1/templates" \
    -H "$AUTH_HEADER")

LIST_TPL_STATUS=$(echo "$LIST_TPL_RESPONSE" | tail -1)
assert_status "List all templates" "200" "$LIST_TPL_STATUS"

# ═══════════════════════════════════════════════════════════════════════════════
# NOTIFICATIONS TESTS
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Notifications: Get notifications"

GET_NOTIF_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/v1/notifications" \
    -H "$AUTH_HEADER")

GET_NOTIF_STATUS=$(echo "$GET_NOTIF_RESPONSE" | tail -1)
assert_status "Get notifications" "200" "$GET_NOTIF_STATUS"

# ─── Notification count ──────────────────────────────────────────────────────
print_section "Notifications: Get unread count"

GET_COUNT_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/v1/notifications/count" \
    -H "$AUTH_HEADER")

GET_COUNT_STATUS=$(echo "$GET_COUNT_RESPONSE" | tail -1)
assert_status "Get notification count" "200" "$GET_COUNT_STATUS"

# ═══════════════════════════════════════════════════════════════════════════════
# DASHBOARD TESTS
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Dashboard: Get admin dashboard"

GET_DASH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/v1/dashboard/admin" \
    -H "$AUTH_HEADER")

GET_DASH_STATUS=$(echo "$GET_DASH_RESPONSE" | tail -1)
assert_status "Get admin dashboard" "200" "$GET_DASH_STATUS"

# ═══════════════════════════════════════════════════════════════════════════════
# CLEANUP
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Cleanup: Deleting test data"

# Delete interview
if [ -n "$INTERVIEW_ID" ] && [ "$INTERVIEW_ID" != "null" ]; then
    DEL_IV_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/v1/interviews/$INTERVIEW_ID" \
        -H "$AUTH_HEADER")
    DEL_IV_STATUS=$(echo "$DEL_IV_RESPONSE" | tail -1)
    if [ "$DEL_IV_STATUS" = "204" ] || [ "$DEL_IV_STATUS" = "200" ]; then
        echo -e "  ${GREEN}✓${NC} Deleted interview $INTERVIEW_ID"
    else
        echo -e "  ${YELLOW}!${NC} Could not delete interview (HTTP $DEL_IV_STATUS)"
    fi
else
    echo -e "  ${YELLOW}-${NC} No interview to delete"
fi

# Delete template
if [ -n "$TEMPLATE_ID" ] && [ "$TEMPLATE_ID" != "null" ]; then
    DEL_TPL_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/v1/templates/$TEMPLATE_ID" \
        -H "$AUTH_HEADER")
    DEL_TPL_STATUS=$(echo "$DEL_TPL_RESPONSE" | tail -1)
    if [ "$DEL_TPL_STATUS" = "204" ] || [ "$DEL_TPL_STATUS" = "200" ]; then
        echo -e "  ${GREEN}✓${NC} Deleted template $TEMPLATE_ID"
    else
        echo -e "  ${YELLOW}!${NC} Could not delete template (HTTP $DEL_TPL_STATUS)"
    fi
else
    echo -e "  ${YELLOW}-${NC} No template to delete"
fi

# Delete question
if [ -n "$QUESTION_ID" ] && [ "$QUESTION_ID" != "null" ]; then
    DEL_Q_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/v1/questions/$QUESTION_ID" \
        -H "$AUTH_HEADER")
    DEL_Q_STATUS=$(echo "$DEL_Q_RESPONSE" | tail -1)
    if [ "$DEL_Q_STATUS" = "204" ] || [ "$DEL_Q_STATUS" = "200" ]; then
        echo -e "  ${GREEN}✓${NC} Deleted question $QUESTION_ID"
    else
        echo -e "  ${YELLOW}!${NC} Could not delete question (HTTP $DEL_Q_STATUS)"
    fi
else
    echo -e "  ${YELLOW}-${NC} No question to delete"
fi

# Delete job position
if [ -n "$JOB_POSITION_ID" ] && [ "$JOB_POSITION_ID" != "null" ]; then
    DEL_JP_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/v1/job-positions/$JOB_POSITION_ID" \
        -H "$AUTH_HEADER")
    DEL_JP_STATUS=$(echo "$DEL_JP_RESPONSE" | tail -1)
    if [ "$DEL_JP_STATUS" = "204" ] || [ "$DEL_JP_STATUS" = "200" ]; then
        echo -e "  ${GREEN}✓${NC} Deleted job position $JOB_POSITION_ID"
    else
        echo -e "  ${YELLOW}!${NC} Could not delete job position (HTTP $DEL_JP_STATUS)"
    fi
else
    echo -e "  ${YELLOW}-${NC} No job position to delete"
fi

# Delete test user (need user ID)
if [ -n "$USER_ID" ] && [ "$USER_ID" != "null" ]; then
    DEL_USER_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/v1/users/$USER_ID" \
        -H "$AUTH_HEADER")
    DEL_USER_STATUS=$(echo "$DEL_USER_RESPONSE" | tail -1)
    if [ "$DEL_USER_STATUS" = "204" ] || [ "$DEL_USER_STATUS" = "200" ]; then
        echo -e "  ${GREEN}✓${NC} Deleted test user $USER_ID"
    else
        echo -e "  ${YELLOW}!${NC} Could not delete test user (HTTP $DEL_USER_STATUS) - may require ADMIN role"
    fi
else
    echo -e "  ${YELLOW}-${NC} No test user ID to delete"
fi

echo -e "  ${GREEN}✓${NC} Cleanup complete"

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════
print_header "Test Results Summary"
echo ""
echo -e "  Total Tests:  $TOTAL"
echo -e "  ${GREEN}Passed:       $PASSED${NC}"
echo -e "  ${RED}Failed:       $FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}  RESULT: FAILED ($FAILED test(s) failed)${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    exit 1
else
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  RESULT: ALL TESTS PASSED${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    exit 0
fi
