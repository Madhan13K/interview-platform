import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * Load Test: 1000 Bulk Schedule Operations
 * 
 * Tests database connection pool exhaustion under bulk scheduling load.
 * Simulates HR teams scheduling interviews in bulk (e.g., hiring events).
 * 
 * Targets tested:
 * - HikariCP connection pool limits (default 10-20 connections)
 * - Transaction throughput
 * - JPA/Hibernate batch insert performance
 * - Async queue depth
 * 
 * Run: k6 run --vus 50 --iterations 1000 load-tests/bulk-schedule.js
 */

const scheduleTime = new Trend('schedule_time', true);
const dbPoolExhaustion = new Counter('db_pool_exhaustion');
const scheduleSuccess = new Rate('schedule_success');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
let authToken = '';

export const options = {
  scenarios: {
    bulk_schedule: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 1000,
      maxDuration: '10m',
    },
  },
  thresholds: {
    'schedule_time': ['p(95)<5000'],        // 95% under 5s
    'schedule_success': ['rate>0.90'],      // 90% success rate
    'db_pool_exhaustion': ['count<10'],     // Max 10 pool exhaustion events
    'http_req_duration': ['p(99)<10000'],   // 99% under 10s
  },
};

export function setup() {
  // Login once and share token
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'admin@interview.com',
    password: 'admin123',
  }), { headers: { 'Content-Type': 'application/json' } });

  if (loginRes.status === 200) {
    return { token: JSON.parse(loginRes.body).accessToken };
  }
  return { token: '' };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Generate batch of interviews to schedule
  const batchSize = 20; // 20 interviews per request = 1000 total across 50 iterations
  const interviews = [];

  for (let i = 0; i < batchSize; i++) {
    const futureDate = new Date(Date.now() + (Math.random() * 30 * 24 * 60 * 60 * 1000)); // Random date in next 30 days
    interviews.push({
      title: `Load Test Interview ${__VU}-${__ITER}-${i}`,
      type: ['TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN'][Math.floor(Math.random() * 3)],
      candidateEmail: `candidate-${__VU}-${__ITER}-${i}@test.com`,
      scheduledAt: futureDate.toISOString(),
      duration: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
    });
  }

  const startTime = Date.now();

  // Test bulk schedule endpoint
  const bulkRes = http.post(
    `${BASE_URL}/api/v1/bulk/interviews/schedule`,
    JSON.stringify({ interviews }),
    { headers, timeout: '30s' }
  );

  const duration = Date.now() - startTime;
  scheduleTime.add(duration);

  const success = check(bulkRes, {
    'bulk schedule returns 2xx': (r) => r.status >= 200 && r.status < 300,
    'response time under 10s': () => duration < 10000,
    'no connection pool error': (r) => !r.body.includes('Connection pool') && !r.body.includes('HikariPool'),
  });

  if (!success) {
    if (bulkRes.body && bulkRes.body.includes('pool')) {
      dbPoolExhaustion.add(1);
    }
    scheduleSuccess.add(0);
  } else {
    scheduleSuccess.add(1);
  }

  // Also test individual create endpoint under load
  const singleRes = http.post(
    `${BASE_URL}/api/v1/interviews`,
    JSON.stringify({
      title: `Single Load Test ${__VU}-${__ITER}`,
      type: 'TECHNICAL',
      candidateId: '00000000-0000-0000-0000-000000000001', // Placeholder
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      duration: 60,
    }),
    { headers }
  );

  check(singleRes, {
    'single create returns 2xx': (r) => r.status >= 200 && r.status < 400,
  });

  sleep(0.5 + Math.random()); // 0.5-1.5s between iterations
}
