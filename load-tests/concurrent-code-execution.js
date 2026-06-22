import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * Load Test: 50 Concurrent Code Executions (Docker Container Limits)
 * 
 * Tests the sandboxed code execution engine under concurrent load.
 * Each execution spins up a Docker container - tests container pool limits.
 * 
 * Targets tested:
 * - Docker daemon capacity (concurrent container creation)
 * - Container startup time under load
 * - Memory/CPU resource contention
 * - Orphan container cleanup
 * - Execution timeout enforcement
 * 
 * Run: k6 run --vus 50 --duration 5m load-tests/concurrent-code-execution.js
 */

const executionTime = new Trend('execution_time', true);
const containerStartup = new Trend('container_startup', true);
const executionSuccess = new Rate('execution_success');
const timeoutErrors = new Counter('timeout_errors');
const resourceErrors = new Counter('resource_errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
  scenarios: {
    concurrent_executions: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },  // Warm up
        { duration: '30s', target: 25 },  // Moderate
        { duration: '1m', target: 50 },   // Full 50 concurrent
        { duration: '2m', target: 50 },   // Sustain
        { duration: '30s', target: 0 },   // Cool down
      ],
    },
  },
  thresholds: {
    'execution_time': ['p(95)<15000'],    // 95% complete under 15s
    'container_startup': ['p(95)<5000'],  // Container starts under 5s
    'execution_success': ['rate>0.80'],   // 80% success (some timeouts expected)
    'timeout_errors': ['count<25'],       // Max 25 timeouts
    'resource_errors': ['count<10'],      // Max 10 resource errors
  },
};

// Code samples in different languages for varied load
const CODE_SAMPLES = [
  {
    language: 'python',
    code: `
import time
def fibonacci(n):
    if n <= 1: return n
    return fibonacci(n-1) + fibonacci(n-2)

result = fibonacci(30)
print(f"Fibonacci(30) = {result}")
`,
    stdin: '',
  },
  {
    language: 'javascript',
    code: `
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}
function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return result.concat(left.slice(i)).concat(right.slice(j));
}
const arr = Array.from({length: 10000}, () => Math.floor(Math.random() * 10000));
const sorted = mergeSort(arr);
console.log("Sorted", sorted.length, "elements");
`,
    stdin: '',
  },
  {
    language: 'java',
    code: `
public class Main {
    public static void main(String[] args) {
        int n = 1000000;
        int[] sieve = new int[n + 1];
        int count = 0;
        for (int i = 2; i <= n; i++) {
            if (sieve[i] == 0) {
                count++;
                for (int j = i * 2; j <= n; j += i) sieve[j] = 1;
            }
        }
        System.out.println("Primes up to " + n + ": " + count);
    }
}
`,
    stdin: '',
  },
  {
    language: 'python',
    code: `
# Intentional slow code to test timeout enforcement
import time
time.sleep(25)  # Should be killed by timeout
print("Should not reach here")
`,
    stdin: '',
  },
  {
    language: 'python',
    code: `
# Memory-intensive operation to test resource limits
data = []
for i in range(10000):
    data.append([0] * 1000)
print(f"Allocated {len(data)} arrays")
`,
    stdin: '',
  },
];

export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'admin@interview.com',
    password: 'admin123',
  }), { headers: { 'Content-Type': 'application/json' } });

  return loginRes.status === 200 ? { token: JSON.parse(loginRes.body).accessToken } : { token: '' };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
  };

  // Pick a random code sample
  const sample = CODE_SAMPLES[Math.floor(Math.random() * CODE_SAMPLES.length)];

  const startTime = Date.now();

  const res = http.post(
    `${BASE_URL}/api/v1/code-execution/run`,
    JSON.stringify({
      code: sample.code,
      language: sample.language,
      stdin: sample.stdin,
      timeoutMs: 10000,
    }),
    { headers, timeout: '30s' }
  );

  const duration = Date.now() - startTime;
  executionTime.add(duration);

  const passed = check(res, {
    'execution returns 2xx': (r) => r.status >= 200 && r.status < 300,
    'no resource error': (r) => !r.body.includes('resource') && !r.body.includes('OOM'),
  });

  if (res.status === 200) {
    executionSuccess.add(1);
    try {
      const body = JSON.parse(res.body);
      if (body.status === 'TIMEOUT' || (body.stderr && body.stderr.includes('timeout'))) {
        timeoutErrors.add(1);
      }
      if (body.executionTimeMs) {
        containerStartup.add(Math.max(0, duration - body.executionTimeMs));
      }
    } catch (e) {
      // Response parsing failed
    }
  } else {
    executionSuccess.add(0);
    if (res.status === 503 || (res.body && res.body.includes('resource'))) {
      resourceErrors.add(1);
    }
    if (res.status === 408 || (res.body && res.body.includes('timeout'))) {
      timeoutErrors.add(1);
    }
  }

  sleep(1 + Math.random() * 2); // 1-3s between executions
}
