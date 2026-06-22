import ws from 'k6/ws';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * Load Test: 100 Concurrent Interview Sessions (WebSocket)
 * 
 * Tests WebSocket connection limits under concurrent interview load.
 * Each VU simulates a participant joining an interview session via STOMP/WebSocket.
 * 
 * Targets tested:
 * - WebSocket connection pool capacity
 * - STOMP frame processing throughput
 * - Memory pressure from concurrent sessions
 * - Message broadcast latency (N participants per room)
 * 
 * Run: k6 run --vus 100 --duration 5m load-tests/concurrent-interviews.js
 */

// Custom metrics
const wsConnectTime = new Trend('ws_connect_time', true);
const wsMessageLatency = new Trend('ws_message_latency', true);
const wsErrors = new Counter('ws_errors');
const wsConnectSuccess = new Rate('ws_connect_success');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const WS_URL = __ENV.WS_URL || 'ws://localhost:8080/ws';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export const options = {
  scenarios: {
    concurrent_interviews: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 25 },   // Ramp up to 25 connections
        { duration: '30s', target: 50 },   // Ramp to 50
        { duration: '1m', target: 100 },   // Full 100 concurrent
        { duration: '3m', target: 100 },   // Sustain 100
        { duration: '30s', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    'ws_connect_time': ['p(95)<2000'],     // 95% connect under 2s
    'ws_message_latency': ['p(95)<500'],   // 95% messages under 500ms
    'ws_connect_success': ['rate>0.95'],   // 95% connections succeed
    'ws_errors': ['count<50'],             // Less than 50 total errors
  },
};

// Get auth token (login)
function getAuthToken() {
  if (AUTH_TOKEN) return AUTH_TOKEN;
  
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: `load-test-${__VU}@interview.com`,
    password: 'TestPass123!',
  }), { headers: { 'Content-Type': 'application/json' } });
  
  if (loginRes.status === 200) {
    return JSON.parse(loginRes.body).accessToken;
  }
  return '';
}

export default function () {
  const token = getAuthToken();
  const interviewId = `interview-${Math.floor(__VU / 4)}`; // 4 participants per room
  const connectStart = Date.now();

  const url = `${WS_URL}?token=${token}`;

  const res = ws.connect(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  }, function (socket) {
    const connectDuration = Date.now() - connectStart;
    wsConnectTime.add(connectDuration);
    wsConnectSuccess.add(1);

    // STOMP CONNECT frame
    socket.send('CONNECT\naccept-version:1.2\nheart-beat:10000,10000\n\n\0');

    socket.on('message', function (msg) {
      if (msg.includes('CONNECTED')) {
        // Subscribe to interview topic
        socket.send(`SUBSCRIBE\nid:sub-0\ndestination:/topic/interview/${interviewId}\n\n\0`);
        
        // Send JOIN message
        const joinFrame = `SEND\ndestination:/app/interview/${interviewId}/join\ncontent-type:application/json\n\n{"userId":"user-${__VU}","type":"JOIN"}\0`;
        socket.send(joinFrame);
      }

      // Track message latency for broadcast messages
      if (msg.includes('/topic/interview/')) {
        wsMessageLatency.add(Date.now() - connectStart);
      }
    });

    socket.on('error', function (e) {
      wsErrors.add(1);
      wsConnectSuccess.add(0);
    });

    // Simulate periodic activity (chat messages, code updates)
    socket.setInterval(function () {
      const chatFrame = `SEND\ndestination:/app/interview/${interviewId}/chat\ncontent-type:application/json\n\n{"content":"Test message from VU ${__VU}","type":"CHAT"}\0`;
      socket.send(chatFrame);
    }, 3000 + Math.random() * 2000); // Every 3-5 seconds

    // Keep connection alive for the test duration
    socket.setTimeout(function () {
      // Send LEAVE before disconnecting
      const leaveFrame = `SEND\ndestination:/app/interview/${interviewId}/leave\ncontent-type:application/json\n\n{"userId":"user-${__VU}","type":"LEAVE"}\0`;
      socket.send(leaveFrame);
      socket.close();
    }, 60000 + Math.random() * 30000); // 60-90 seconds per session
  });

  if (!res || res.status !== 101) {
    wsErrors.add(1);
    wsConnectSuccess.add(0);
  }

  sleep(1);
}
