import ws from 'k6/ws';
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

/**
 * Load Test: High-Frequency Code Saves (WebSocket Throughput)
 * 
 * Tests WebSocket message throughput for code editor real-time sync.
 * Simulates multiple users typing/saving code rapidly in collaborative sessions.
 * 
 * Targets tested:
 * - STOMP message broker throughput (SimpleBroker vs external)
 * - Message fan-out performance (N participants * M messages)
 * - Code save endpoint under rapid fire
 * - WebSocket frame size limits
 * 
 * Run: k6 run --vus 20 --duration 3m load-tests/code-save-throughput.js
 */

const codeSaveLatency = new Trend('code_save_latency', true);
const wsMessagesSent = new Counter('ws_messages_sent');
const wsMessagesReceived = new Counter('ws_messages_received');
const codeSaveErrors = new Counter('code_save_errors');
const throughput = new Rate('message_delivery_rate');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const WS_URL = __ENV.WS_URL || 'ws://localhost:8080/ws';

export const options = {
  scenarios: {
    code_collaboration: {
      executor: 'constant-vus',
      vus: 20,  // 20 concurrent editors
      duration: '3m',
    },
  },
  thresholds: {
    'code_save_latency': ['p(95)<1000'],    // 95% under 1s
    'ws_messages_sent': ['count>1000'],      // At least 1000 messages sent
    'code_save_errors': ['count<50'],        // Less than 50 errors
    'message_delivery_rate': ['rate>0.95'],  // 95% delivery rate
  },
};

// Simulate code content of varying sizes
function generateCodeContent(size) {
  const lines = [];
  for (let i = 0; i < size; i++) {
    lines.push(`  const var${i} = compute(${i}); // Line ${i} - ${Date.now()}`);
  }
  return `function solution() {\n${lines.join('\n')}\n  return result;\n}`;
}

export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    email: 'admin@interview.com',
    password: 'admin123',
  }), { headers: { 'Content-Type': 'application/json' } });

  return loginRes.status === 200 ? { token: JSON.parse(loginRes.body).accessToken } : { token: '' };
}

export default function (data) {
  const interviewId = `code-session-${Math.floor(__VU / 4)}`; // 4 editors per session
  const url = `${WS_URL}?token=${data.token}`;

  const res = ws.connect(url, {}, function (socket) {
    // STOMP handshake
    socket.send('CONNECT\naccept-version:1.2\nheart-beat:10000,10000\n\n\0');

    let connected = false;
    let messageCount = 0;

    socket.on('message', function (msg) {
      if (msg.includes('CONNECTED') && !connected) {
        connected = true;
        // Subscribe to code updates
        socket.send(`SUBSCRIBE\nid:sub-code\ndestination:/topic/interview/${interviewId}/code\n\n\0`);
      }

      if (msg.includes('/code')) {
        wsMessagesReceived.add(1);
        throughput.add(1);
      }
    });

    socket.on('error', function () {
      codeSaveErrors.add(1);
      throughput.add(0);
    });

    // Simulate rapid code editing (every 200-500ms like real typing)
    socket.setInterval(function () {
      if (!connected) return;

      messageCount++;
      const codeSize = 10 + Math.floor(Math.random() * 50); // 10-60 lines
      const code = generateCodeContent(codeSize);
      const sendStart = Date.now();

      const codeFrame = `SEND\ndestination:/app/interview/${interviewId}/code\ncontent-type:application/json\n\n${JSON.stringify({
        code: code,
        language: 'javascript',
        cursorPosition: { line: Math.floor(Math.random() * codeSize), col: Math.floor(Math.random() * 40) },
        userId: `user-${__VU}`,
        timestamp: sendStart,
      })}\0`;

      socket.send(codeFrame);
      wsMessagesSent.add(1);
      codeSaveLatency.add(Date.now() - sendStart);

      // Also test HTTP code save endpoint periodically
      if (messageCount % 10 === 0) {
        http.put(
          `${BASE_URL}/api/v1/interviews/${interviewId}/code/save`,
          JSON.stringify({ code, language: 'javascript' }),
          { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` } }
        );
      }
    }, 200 + Math.random() * 300); // 200-500ms (typing speed)

    // Run for 30-60 seconds per connection
    socket.setTimeout(function () {
      socket.close();
    }, 30000 + Math.random() * 30000);
  });

  sleep(2);
}
