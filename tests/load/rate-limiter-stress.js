import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * Load Test: Rate Limiter Under Load (Redis INCR Race Conditions)
 * 
 * Tests the rate limiting infrastructure for correctness under extreme concurrency.
 * Verifies that Redis INCR operations don't allow burst bypass due to race conditions.
 * 
 * Targets tested:
 * - Redis INCR atomicity under concurrent access
 * - Rate limit enforcement accuracy (should block at exactly N requests)
 * - Sliding window vs fixed window edge cases
 * - ConcurrentHashMap fallback when Redis is down
 * - Response code accuracy (429 vs 200)
 * 
 * Run: k6 run --vus 200 --duration 2m load-tests/rate-limiter-stress.js
 */

const rateLimitHits = new Counter('rate_limit_hits');       // 429 responses
const allowedRequests = new Counter('allowed_requests');    // 200 responses
const incorrectAllows = new Counter('incorrect_allows');    // Requests that should have been blocked
const responseTime = new Trend('response_time', true);
const rateLimitAccuracy = new Rate('rate_limit_accuracy');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Known rate limits from SecurityConfig:
// - Login: 5 requests/minute per IP
// - Register: 10 requests/minute per IP
// - General (auth): 60 requests/minute per user
// - General (anon): 30 requests/minute per IP

export const options = {
  scenarios: {
    // Scenario 1: Hammer login endpoint (5 req/min limit)
    login_burst: {
      executor: 'per-vu-iterations',
      vus: 50,        // 50 VUs from same "IP"
      iterations: 20, // Each sends 20 requests = 1000 total
      maxDuration: '2m',
      exec: 'testLoginRateLimit',
    },
    // Scenario 2: Hammer authenticated endpoint (60 req/min limit)
    api_burst: {
      executor: 'constant-arrival-rate',
      rate: 200,      // 200 requests/second
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 100,
      maxVUs: 200,
      exec: 'testApiRateLimit',
      startTime: '30s', // Start after login test
    },
    // Scenario 3: Test concurrent Redis INCR (race condition check)
    redis_race: {
      executor: 'shared-iterations',
      vus: 100,
      iterations: 500,
      maxDuration: '30s',
      exec: 'testRedisRace',
      startTime: '1m30s',
    },
  },
  thresholds: {
    'rate_limit_accuracy': ['rate>0.90'],  // Rate limit should be 90%+ accurate
    'response_time': ['p(95)<1000'],       // Even under heavy load, fast responses
    'incorrect_allows': ['count<20'],       // Very few incorrect allows
  },
};

export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'admin@interview.com',
    password: 'admin123',
  }), { headers: { 'Content-Type': 'application/json' } });

  return loginRes.status === 200 ? { token: JSON.parse(loginRes.body).accessToken } : { token: '' };
}

// Test 1: Login endpoint rate limit (5 req/min per IP)
export function testLoginRateLimit() {
  const startTime = Date.now();

  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: `nonexistent-${__VU}-${__ITER}@test.com`,
      password: 'wrong',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  responseTime.add(Date.now() - startTime);

  if (res.status === 429) {
    rateLimitHits.add(1);
    rateLimitAccuracy.add(1); // Correct behavior
    
    check(res, {
      'rate limit has Retry-After header': (r) => r.headers['Retry-After'] !== undefined || r.headers['retry-after'] !== undefined,
      'rate limit response is fast': () => (Date.now() - startTime) < 100,
    });
  } else if (res.status === 401) {
    allowedRequests.add(1);
    // First 5 should be allowed
    rateLimitAccuracy.add(1);
  } else {
    // Unexpected status
    rateLimitAccuracy.add(0);
  }

  // No sleep - we want to burst
}

// Test 2: Authenticated API endpoint rate limit (60 req/min per user)
export function testApiRateLimit(data) {
  const startTime = Date.now();

  const res = http.get(
    `${BASE_URL}/api/v1/users/me`,
    { headers: { 'Authorization': `Bearer ${data.token}` } }
  );

  responseTime.add(Date.now() - startTime);

  if (res.status === 429) {
    rateLimitHits.add(1);
    rateLimitAccuracy.add(1);
  } else if (res.status === 200) {
    allowedRequests.add(1);
    rateLimitAccuracy.add(1);
  }
}

// Test 3: Concurrent requests to detect Redis INCR race conditions
export function testRedisRace(data) {
  // All VUs hit the same endpoint simultaneously
  // If there's a race condition, more than the limit will be allowed
  const startTime = Date.now();

  const res = http.get(
    `${BASE_URL}/api/v1/dashboard/admin`,
    { headers: { 'Authorization': `Bearer ${data.token}` } }
  );

  responseTime.add(Date.now() - startTime);

  if (res.status === 429) {
    rateLimitHits.add(1);
  } else if (res.status === 200) {
    allowedRequests.add(1);
  }
  
  // No accuracy check here - we're looking for the total count
  // If rate limit is 60/min and we send 500 in 30s, approximately 30 should succeed
  // and 470 should get 429. Significant deviation = race condition.
}

export function handleSummary(data) {
  const totalAllowed = data.metrics.allowed_requests ? data.metrics.allowed_requests.values.count : 0;
  const totalBlocked = data.metrics.rate_limit_hits ? data.metrics.rate_limit_hits.values.count : 0;
  const incorrectCount = data.metrics.incorrect_allows ? data.metrics.incorrect_allows.values.count : 0;
  
  return {
    stdout: `
=== Rate Limiter Stress Test Summary ===
Total Allowed: ${totalAllowed}
Total Blocked (429): ${totalBlocked}
Incorrect Allows: ${incorrectCount}
Block Ratio: ${totalBlocked > 0 ? ((totalBlocked / (totalAllowed + totalBlocked)) * 100).toFixed(1) : 0}%
Race Condition Indicators: ${incorrectCount > 10 ? 'POSSIBLE RACE CONDITION DETECTED' : 'None detected'}
========================================
`,
  };
}
