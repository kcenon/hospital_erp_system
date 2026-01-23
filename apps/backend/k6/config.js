/**
 * k6 Performance Test Configuration
 *
 * Centralizes configuration for all k6 test scripts.
 * SDS Reference: Section 2.1 (Design Goals)
 * Requirements: REQ-NFR-001~003, REQ-NFR-005
 */

export const config = {
  baseUrl: __ENV.BASE_URL || 'http://localhost:3000',

  // Test user credentials (should be seeded in test database)
  testUser: {
    username: __ENV.TEST_USERNAME || 'admin',
    password: __ENV.TEST_PASSWORD || 'admin123',
  },

  // Performance thresholds based on SDS requirements
  thresholds: {
    // REQ-NFR-002: 95% of requests under 500ms
    http_req_duration: ['p(95)<500'],
    // Error rate under 1%
    http_req_failed: ['rate<0.01'],
  },

  // Relaxed thresholds for smoke tests (CI environment may have cold start delays)
  smokeTestThresholds: {
    http_req_duration: ['p(95)<500'],
    // Allow slightly higher error rate for smoke tests (up to 5%)
    http_req_failed: ['rate<0.05'],
  },

  // Test scenarios
  scenarios: {
    // Normal load: 50 concurrent users
    normalLoad: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
    },
    // Peak load: ramp up to 100 concurrent users
    peakLoad: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
    },
    // Smoke test: quick validation
    smokeTest: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
    },
    // Stress test: find breaking point
    stressTest: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 150 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 0 },
      ],
    },
  },
};

export default config;
