#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Database Integration Test Script
# Verifies migrations, schema integrity, constraints, and CRUD operations
# ═══════════════════════════════════════════════════════════════════════════════

set -o pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-interview_platform}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

TEST_PREFIX="ci_test_"
TIMESTAMP=$(date +%s)

# Counters
TOTAL=0
PASSED=0
FAILED=0

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

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

assert_pass() {
    local test_name="$1"
    local result="$2"  # 0 = pass, non-zero = fail
    TOTAL=$((TOTAL + 1))

    if [ "$result" -eq 0 ]; then
        PASSED=$((PASSED + 1))
        echo -e "  ${GREEN}✓ PASS${NC} - $test_name"
    else
        FAILED=$((FAILED + 1))
        echo -e "  ${RED}✗ FAIL${NC} - $test_name"
    fi
}

assert_fail() {
    local test_name="$1"
    local result="$2"  # non-zero = expected failure (pass), 0 = unexpected success (fail)
    TOTAL=$((TOTAL + 1))

    if [ "$result" -ne 0 ]; then
        PASSED=$((PASSED + 1))
        echo -e "  ${GREEN}✓ PASS${NC} - $test_name (constraint violation detected as expected)"
    else
        FAILED=$((FAILED + 1))
        echo -e "  ${RED}✗ FAIL${NC} - $test_name (expected failure but succeeded)"
    fi
}

assert_equals() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    TOTAL=$((TOTAL + 1))

    if [ "$expected" = "$actual" ]; then
        PASSED=$((PASSED + 1))
        echo -e "  ${GREEN}✓ PASS${NC} - $test_name"
    else
        FAILED=$((FAILED + 1))
        echo -e "  ${RED}✗ FAIL${NC} - $test_name (expected '$expected', got '$actual')"
    fi
}

assert_gte() {
    local test_name="$1"
    local minimum="$2"
    local actual="$3"
    TOTAL=$((TOTAL + 1))

    if [ "$actual" -ge "$minimum" ] 2>/dev/null; then
        PASSED=$((PASSED + 1))
        echo -e "  ${GREEN}✓ PASS${NC} - $test_name (count: $actual >= $minimum)"
    else
        FAILED=$((FAILED + 1))
        echo -e "  ${RED}✗ FAIL${NC} - $test_name (expected >= $minimum, got '$actual')"
    fi
}

# Execute SQL and return output
run_sql() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -A -c "$1" 2>/dev/null | tr -d '\n\r '
}

# Execute SQL and return exit code (suppresses output)
run_sql_check() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -A -c "$1" > /dev/null 2>&1
    return $?
}

# ─── Pre-flight Check ─────────────────────────────────────────────────────────
print_header "Database Integration Tests"
echo "  Host:     $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"
echo ""
echo "Checking database connectivity..."

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Cannot connect to PostgreSQL at $DB_HOST:$DB_PORT/$DB_NAME${NC}"
    echo "Ensure PostgreSQL is running and credentials are correct."
    echo "Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD env vars as needed."
    exit 1
fi
echo -e "${GREEN}Database connection successful.${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# 1. FLYWAY MIGRATIONS CHECK
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Flyway Migrations"

# Check flyway_schema_history exists
FLYWAY_EXISTS=$(run_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'flyway_schema_history';")
assert_equals "flyway_schema_history table exists" "1" "$FLYWAY_EXISTS"

# Check all migrations succeeded
FAILED_MIGRATIONS=$(run_sql "SELECT COUNT(*) FROM flyway_schema_history WHERE success = false;")
assert_equals "No failed migrations" "0" "$FAILED_MIGRATIONS"

# Check number of applied migrations (at least the core ones V1-V15)
MIGRATION_COUNT=$(run_sql "SELECT COUNT(*) FROM flyway_schema_history WHERE success = true;")
assert_gte "Sufficient migrations applied" "15" "$MIGRATION_COUNT"

# List latest migrations for info
echo ""
echo "  Latest 5 migrations:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -t -A -c "SELECT '    ' || version || ' - ' || description FROM flyway_schema_history WHERE success = true ORDER BY installed_rank DESC LIMIT 5;" 2>/dev/null

# ═══════════════════════════════════════════════════════════════════════════════
# 2. TABLE EXISTENCE CHECKS
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Required Tables Exist"

REQUIRED_TABLES=(
    "users"
    "roles"
    "permissions"
    "user_roles"
    "role_permissions"
    "refresh_tokens"
    "interviews"
    "interview_interviewers"
    "job_positions"
    "question_categories"
    "questions"
    "interview_templates"
    "notifications"
    "interviewer_availability"
)

for table in "${REQUIRED_TABLES[@]}"; do
    TABLE_EXISTS=$(run_sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table';")
    assert_equals "Table '$table' exists" "1" "$TABLE_EXISTS"
done

# ═══════════════════════════════════════════════════════════════════════════════
# 3. FOREIGN KEY CONSTRAINTS
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Foreign Key Constraints"

# Try inserting a user_role with non-existent user_id (should fail)
FAKE_UUID="00000000-0000-0000-0000-000000000099"
run_sql_check "INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (gen_random_uuid(), '$FAKE_UUID', '$FAKE_UUID', NOW());"
assert_fail "FK violation: user_roles with non-existent user_id" $?

# Try inserting a refresh_token with non-existent user_id (should fail)
run_sql_check "INSERT INTO refresh_tokens (id, token, user_id, expiry_date, revoked) VALUES (gen_random_uuid(), 'fake_token_ci_${TIMESTAMP}', '$FAKE_UUID', NOW(), false);"
assert_fail "FK violation: refresh_tokens with non-existent user_id" $?

# Try inserting an interview_interviewers with non-existent interview_id (should fail)
run_sql_check "INSERT INTO interview_interviewers (id, interview_id, interviewer_id, primary_interviewer) VALUES (gen_random_uuid(), '$FAKE_UUID', '$FAKE_UUID', false);"
assert_fail "FK violation: interview_interviewers with non-existent interview_id" $?

# Try inserting a question with non-existent category_id (should fail)
run_sql_check "INSERT INTO questions (id, title, category_id, difficulty, type, is_active, created_at) VALUES (gen_random_uuid(), 'test', '$FAKE_UUID', 'EASY', 'CODING', true, NOW());"
assert_fail "FK violation: questions with non-existent category_id" $?

# ═══════════════════════════════════════════════════════════════════════════════
# 4. INDEX CHECKS
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Key Indexes Exist"

EXPECTED_INDEXES=(
    "idx_user_roles_user_id"
    "idx_user_roles_role_id"
    "idx_role_permissions_role_id"
    "idx_refresh_tokens_user_id"
    "idx_interviews_candidate_id"
    "idx_interviews_start_time"
    "idx_interview_interviewers_interview_id"
    "idx_job_positions_status"
    "idx_job_positions_department"
)

for idx in "${EXPECTED_INDEXES[@]}"; do
    IDX_EXISTS=$(run_sql "SELECT COUNT(*) FROM pg_indexes WHERE indexname = '$idx';")
    assert_equals "Index '$idx' exists" "1" "$IDX_EXISTS"
done

# ═══════════════════════════════════════════════════════════════════════════════
# 5. CRUD CYCLE ON MAIN TABLES
# ═══════════════════════════════════════════════════════════════════════════════
print_section "CRUD Operations: Users table"

# INSERT
TEST_USER_EMAIL="${TEST_PREFIX}dbtest_${TIMESTAMP}@example.com"
TEST_USER_ID=$(run_sql "INSERT INTO users (id, first_name, last_name, email, password, status, auth_provider, created_at) VALUES (gen_random_uuid(), '${TEST_PREFIX}First', '${TEST_PREFIX}Last', '$TEST_USER_EMAIL', 'hashed_pw_ci_test', 'ACTIVE', 'LOCAL', NOW()) RETURNING id;")
assert_pass "INSERT user" $?

# SELECT
FOUND_EMAIL=$(run_sql "SELECT email FROM users WHERE id = '$TEST_USER_ID';")
assert_equals "SELECT user returns correct email" "$TEST_USER_EMAIL" "$FOUND_EMAIL"

# UPDATE
run_sql_check "UPDATE users SET first_name = '${TEST_PREFIX}Updated' WHERE id = '$TEST_USER_ID';"
assert_pass "UPDATE user" $?

UPDATED_NAME=$(run_sql "SELECT first_name FROM users WHERE id = '$TEST_USER_ID';")
assert_equals "UPDATE user reflected" "${TEST_PREFIX}Updated" "$UPDATED_NAME"

# ─── CRUD: Roles ─────────────────────────────────────────────────────────────
print_section "CRUD Operations: Roles table"

TEST_ROLE_NAME="${TEST_PREFIX}role_${TIMESTAMP}"
TEST_ROLE_ID=$(run_sql "INSERT INTO roles (id, name, description, created_at) VALUES (gen_random_uuid(), '$TEST_ROLE_NAME', 'CI test role', NOW()) RETURNING id;")
assert_pass "INSERT role" $?

FOUND_ROLE=$(run_sql "SELECT name FROM roles WHERE id = '$TEST_ROLE_ID';")
assert_equals "SELECT role returns correct name" "$TEST_ROLE_NAME" "$FOUND_ROLE"

# ─── CRUD: Question Categories ────────────────────────────────────────────────
print_section "CRUD Operations: Question Categories"

TEST_CAT_NAME="${TEST_PREFIX}category_${TIMESTAMP}"
TEST_CAT_ID=$(run_sql "INSERT INTO question_categories (id, name, description, created_at) VALUES (gen_random_uuid(), '$TEST_CAT_NAME', 'CI test category', NOW()) RETURNING id;")
assert_pass "INSERT question category" $?

# ─── CRUD: Questions ──────────────────────────────────────────────────────────
print_section "CRUD Operations: Questions table"

TEST_Q_ID=$(run_sql "INSERT INTO questions (id, title, description, category_id, difficulty, type, is_active, created_by, created_at) VALUES (gen_random_uuid(), '${TEST_PREFIX}Test Question', 'A test question', '$TEST_CAT_ID', 'EASY', 'CODING', true, '$TEST_USER_ID', NOW()) RETURNING id;")
assert_pass "INSERT question" $?

FOUND_Q=$(run_sql "SELECT title FROM questions WHERE id = '$TEST_Q_ID';")
assert_equals "SELECT question returns correct title" "${TEST_PREFIX}Test Question" "$FOUND_Q"

run_sql_check "UPDATE questions SET title = '${TEST_PREFIX}Updated Question' WHERE id = '$TEST_Q_ID';"
assert_pass "UPDATE question" $?

# ─── CRUD: Job Positions ─────────────────────────────────────────────────────
print_section "CRUD Operations: Job Positions table"

TEST_JP_ID=$(run_sql "INSERT INTO job_positions (id, title, department, location, employment_type, experience_level, status, description, number_of_openings, number_hired, created_by, created_at) VALUES (gen_random_uuid(), '${TEST_PREFIX}Engineer', '${TEST_PREFIX}Eng', 'Remote', 'FULL_TIME', 'SENIOR', 'OPEN', 'CI test', 1, 0, '$TEST_USER_ID', NOW()) RETURNING id;")
assert_pass "INSERT job position" $?

FOUND_JP=$(run_sql "SELECT title FROM job_positions WHERE id = '$TEST_JP_ID';")
assert_equals "SELECT job position returns correct title" "${TEST_PREFIX}Engineer" "$FOUND_JP"

run_sql_check "UPDATE job_positions SET title = '${TEST_PREFIX}Senior Engineer' WHERE id = '$TEST_JP_ID';"
assert_pass "UPDATE job position" $?

# ─── CRUD: Interviews ────────────────────────────────────────────────────────
print_section "CRUD Operations: Interviews table"

TEST_IV_ID=$(run_sql "INSERT INTO interviews (id, title, candidate_id, scheduled_by, start_time, end_time, status, type, mode, created_at) VALUES (gen_random_uuid(), '${TEST_PREFIX}Interview', '$TEST_USER_ID', '$TEST_USER_ID', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', 'SCHEDULED', 'TECHNICAL', 'VIRTUAL', NOW()) RETURNING id;")
assert_pass "INSERT interview" $?

FOUND_IV=$(run_sql "SELECT title FROM interviews WHERE id = '$TEST_IV_ID';")
assert_equals "SELECT interview returns correct title" "${TEST_PREFIX}Interview" "$FOUND_IV"

run_sql_check "UPDATE interviews SET title = '${TEST_PREFIX}Updated Interview' WHERE id = '$TEST_IV_ID';"
assert_pass "UPDATE interview" $?

# ═══════════════════════════════════════════════════════════════════════════════
# 6. UNIQUE CONSTRAINTS
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Unique Constraints"

# Duplicate email should fail
run_sql_check "INSERT INTO users (id, first_name, last_name, email, password, status, auth_provider, created_at) VALUES (gen_random_uuid(), 'Dup', 'User', '$TEST_USER_EMAIL', 'hashed', 'ACTIVE', 'LOCAL', NOW());"
assert_fail "Unique constraint: duplicate email rejected" $?

# Duplicate role name should fail
run_sql_check "INSERT INTO roles (id, name, description, created_at) VALUES (gen_random_uuid(), '$TEST_ROLE_NAME', 'duplicate', NOW());"
assert_fail "Unique constraint: duplicate role name rejected" $?

# Duplicate category name should fail
run_sql_check "INSERT INTO question_categories (id, name, description, created_at) VALUES (gen_random_uuid(), '$TEST_CAT_NAME', 'duplicate', NOW());"
assert_fail "Unique constraint: duplicate category name rejected" $?

# ═══════════════════════════════════════════════════════════════════════════════
# 7. CLEANUP
# ═══════════════════════════════════════════════════════════════════════════════
print_section "Cleanup: Removing test data"

# Delete in reverse dependency order
run_sql_check "DELETE FROM interviews WHERE id = '$TEST_IV_ID';"
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Deleted test interview"
else
    echo -e "  ${YELLOW}!${NC} Could not delete test interview"
fi

run_sql_check "DELETE FROM job_positions WHERE id = '$TEST_JP_ID';"
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Deleted test job position"
else
    echo -e "  ${YELLOW}!${NC} Could not delete test job position"
fi

run_sql_check "DELETE FROM questions WHERE id = '$TEST_Q_ID';"
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Deleted test question"
else
    echo -e "  ${YELLOW}!${NC} Could not delete test question"
fi

run_sql_check "DELETE FROM question_categories WHERE id = '$TEST_CAT_ID';"
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Deleted test category"
else
    echo -e "  ${YELLOW}!${NC} Could not delete test category"
fi

run_sql_check "DELETE FROM roles WHERE id = '$TEST_ROLE_ID';"
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Deleted test role"
else
    echo -e "  ${YELLOW}!${NC} Could not delete test role"
fi

run_sql_check "DELETE FROM users WHERE id = '$TEST_USER_ID';"
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Deleted test user"
else
    echo -e "  ${YELLOW}!${NC} Could not delete test user"
fi

# Catch-all cleanup for any stragglers with the test prefix
run_sql_check "DELETE FROM interviews WHERE title LIKE '${TEST_PREFIX}%';"
run_sql_check "DELETE FROM job_positions WHERE title LIKE '${TEST_PREFIX}%';"
run_sql_check "DELETE FROM questions WHERE title LIKE '${TEST_PREFIX}%';"
run_sql_check "DELETE FROM question_categories WHERE name LIKE '${TEST_PREFIX}%';"
run_sql_check "DELETE FROM roles WHERE name LIKE '${TEST_PREFIX}%';"
run_sql_check "DELETE FROM users WHERE email LIKE '${TEST_PREFIX}%';"

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
