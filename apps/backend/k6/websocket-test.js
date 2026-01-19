/**
 * WebSocket Performance Test Script
 *
 * Tests WebSocket connection, subscription, and broadcast latency.
 * SDS Reference: Section 2.1 (Design Goals)
 * Requirements: REQ-NFR-002, REQ-NFR-003
 *
 * Performance Targets:
 * - WebSocket Connection: < 3 seconds
 * - Broadcast Latency: < 3 seconds
 * - Concurrent Connections: 100+
 *
 * Usage:
 *   k6 run websocket-test.js                           # Default smoke test
 *   k6 run -e SCENARIO=normalLoad websocket-test.js
 *   k6 run -e SCENARIO=peakLoad websocket-test.js
 */

import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { config } from './config.js';
import { login } from './helpers.js';

// Custom metrics for WebSocket performance
const wsConnectionDuration = new Trend('ws_connection_duration', true);
const wsSubscribeDuration = new Trend('ws_subscribe_duration', true);
const wsMessageLatency = new Trend('ws_message_latency', true);
const wsConnectionSuccess = new Rate('ws_connection_success');
const wsSubscribeSuccess = new Rate('ws_subscribe_success');
const wsMessageReceived = new Counter('ws_message_received');
const wsErrors = new Counter('ws_errors');

// WebSocket-specific scenarios
const wsScenarios = {
  smokeTest: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
  },
  normalLoad: {
    executor: 'constant-vus',
    vus: 50,
    duration: '3m',
  },
  peakLoad: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 50 },
      { duration: '2m', target: 100 },
      { duration: '1m', target: 100 },
      { duration: '1m', target: 0 },
    ],
  },
  connectionTest: {
    executor: 'constant-vus',
    vus: 100,
    duration: '1m',
  },
};

const selectedScenario = __ENV.SCENARIO || 'smokeTest';
const scenario = wsScenarios[selectedScenario];

if (!scenario) {
  throw new Error(
    `Unknown scenario: ${selectedScenario}. Available: ${Object.keys(wsScenarios).join(', ')}`,
  );
}

export const options = {
  scenarios: {
    [selectedScenario]: scenario,
  },
  thresholds: {
    ws_connection_duration: ['p(95)<3000'], // 95% connections under 3 seconds
    ws_subscribe_duration: ['p(95)<1000'], // 95% subscriptions under 1 second
    ws_message_latency: ['p(95)<3000'], // 95% messages under 3 seconds
    ws_connection_success: ['rate>0.95'], // 95% connection success rate
    ws_subscribe_success: ['rate>0.95'], // 95% subscription success rate
  },
};

/**
 * Parse Socket.IO message format
 * Socket.IO uses Engine.IO protocol with message types:
 * - 0: open
 * - 2: ping
 * - 3: pong
 * - 4: message (followed by packet type)
 *   - 40: connect
 *   - 42: event
 *   - 43: ack
 */
function parseSocketIOMessage(data) {
  if (!data || data.length === 0) return null;

  const type = data[0];

  // Engine.IO open packet (contains session info)
  if (type === '0') {
    try {
      return { type: 'open', data: JSON.parse(data.slice(1)) };
    } catch {
      return { type: 'open', data: null };
    }
  }

  // Engine.IO ping/pong
  if (type === '2') return { type: 'ping' };
  if (type === '3') return { type: 'pong' };

  // Socket.IO message
  if (type === '4') {
    const packetType = data[1];

    // Socket.IO connect (namespace acknowledgement)
    if (packetType === '0') {
      try {
        const jsonStart = data.indexOf('{');
        if (jsonStart > -1) {
          return { type: 'connect', data: JSON.parse(data.slice(jsonStart)) };
        }
        return { type: 'connect', data: null };
      } catch {
        return { type: 'connect', data: null };
      }
    }

    // Socket.IO event
    if (packetType === '2') {
      try {
        const jsonStart = data.indexOf('[');
        if (jsonStart > -1) {
          const parsed = JSON.parse(data.slice(jsonStart));
          return { type: 'event', event: parsed[0], data: parsed[1] };
        }
      } catch {
        // Ignore parse errors
      }
      return { type: 'event', raw: data };
    }

    // Socket.IO ack
    if (packetType === '3') {
      try {
        const ackIdMatch = data.match(/43(\d+)/);
        const jsonStart = data.indexOf('[');
        if (jsonStart > -1) {
          return {
            type: 'ack',
            id: ackIdMatch ? ackIdMatch[1] : null,
            data: JSON.parse(data.slice(jsonStart)),
          };
        }
      } catch {
        // Ignore parse errors
      }
      return { type: 'ack', raw: data };
    }
  }

  return { type: 'unknown', raw: data };
}

/**
 * Build Socket.IO event message
 * Format: 42["eventName",data]
 */
function buildSocketIOEvent(eventName, data, ackId = null) {
  const payload = JSON.stringify([eventName, data]);
  if (ackId !== null) {
    return `42${ackId}${payload}`;
  }
  return `42${payload}`;
}

// Setup: get authentication token
export function setup() {
  console.log(`Running WebSocket test scenario: ${selectedScenario}`);
  console.log(`Base URL: ${config.baseUrl}`);

  const token = login();
  console.log('Setup completed: authentication successful');

  return { token };
}

// Main test function
export default function (data) {
  const token = data.token;
  const baseUrl = config.baseUrl.replace('http', 'ws');
  // Socket.IO requires polling handshake first, then upgrades to WebSocket
  // We connect directly to the WebSocket endpoint with EIO protocol
  const wsUrl = `${baseUrl}/socket.io/?EIO=4&transport=websocket`;

  const connectionStart = Date.now();
  let connectionEstablished = false;
  let subscriptionAcknowledged = false;
  let messageReceived = false;
  let subscribeStart = 0;

  const response = ws.connect(
    wsUrl,
    {
      headers: {
        Origin: config.baseUrl,
      },
    },
    function (socket) {
      // Handle socket open
      socket.on('open', function () {
        const connectionTime = Date.now() - connectionStart;
        wsConnectionDuration.add(connectionTime);

        const success = connectionTime < 3000;
        wsConnectionSuccess.add(success);

        if (!success) {
          console.warn(`Slow connection: ${connectionTime}ms`);
        }

        connectionEstablished = true;
      });

      // Handle incoming messages
      socket.on('message', function (rawMessage) {
        const message = parseSocketIOMessage(rawMessage);

        if (!message) return;

        // Handle Engine.IO open - respond to establish connection
        if (message.type === 'open') {
          // Connect to /rooms namespace with auth token
          // Format: 40/namespace,{"auth":{"token":"..."}}
          const connectMsg = `40/rooms,${JSON.stringify({ auth: { token } })}`;
          socket.send(connectMsg);
        }

        // Handle Socket.IO namespace connection acknowledgement
        if (message.type === 'connect') {
          console.log('Connected to /rooms namespace');

          // Subscribe to a test floor
          subscribeStart = Date.now();
          const subscribeMsg = buildSocketIOEvent('subscribe:floor', 'test-floor-id', 1);
          socket.send(`/rooms,${subscribeMsg}`);
        }

        // Handle Engine.IO ping - respond with pong
        if (message.type === 'ping') {
          socket.send('3');
        }

        // Handle Socket.IO ack (subscription response)
        if (message.type === 'ack' && subscribeStart > 0) {
          const subscribeTime = Date.now() - subscribeStart;
          wsSubscribeDuration.add(subscribeTime);

          const ackData = message.data;
          const success =
            ackData && Array.isArray(ackData) && ackData[0] && ackData[0].success === true;

          wsSubscribeSuccess.add(success);
          subscriptionAcknowledged = true;

          if (success) {
            console.log(`Subscription acknowledged in ${subscribeTime}ms`);
          } else {
            console.warn(`Subscription response: ${JSON.stringify(ackData)}`);
          }
        }

        // Handle Socket.IO events (room:status, bed:status, etc.)
        if (message.type === 'event') {
          wsMessageReceived.add(1);
          messageReceived = true;

          // Track message latency if timestamp is available
          if (message.data && message.data.timestamp) {
            const serverTime = new Date(message.data.timestamp).getTime();
            const latency = Date.now() - serverTime;
            if (latency > 0 && latency < 60000) {
              // Ignore unreasonable latencies
              wsMessageLatency.add(latency);
            }
          }

          console.log(`Received event: ${message.event}`);
        }
      });

      // Handle errors
      socket.on('error', function (e) {
        console.error(`WebSocket error: ${e.message || e}`);
        wsErrors.add(1);
        wsConnectionSuccess.add(false);
      });

      // Handle close
      socket.on('close', function () {
        if (!connectionEstablished) {
          wsConnectionSuccess.add(false);
        }
      });

      // Keep connection alive for a period
      socket.setTimeout(function () {
        // Unsubscribe before closing
        const unsubscribeMsg = buildSocketIOEvent('unsubscribe:floor', 'test-floor-id');
        socket.send(`/rooms,${unsubscribeMsg}`);
      }, 5000);

      // Close connection after test duration
      socket.setTimeout(function () {
        socket.close();
      }, 8000);
    },
  );

  // Verify connection was successful
  check(response, {
    'WebSocket connection established': () => connectionEstablished,
    'WebSocket status is 101': (r) => r && r.status === 101,
  });

  // Wait before next iteration
  sleep(2);
}

// Teardown
export function teardown(data) {
  console.log('WebSocket test completed');
}
