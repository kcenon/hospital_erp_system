/**
 * Authentication Load Test Script
 *
 * Tests authentication endpoints under load.
 * SDS Reference: Section 2.1 (Design Goals)
 * Requirements: REQ-NFR-002
 *
 * Performance Targets:
 * - Login Response Time: < 1000ms (95th percentile)
 * - Token Refresh: < 500ms (95th percentile)
 * - Error Rate: < 1%
 *
 * Usage:
 *   k6 run auth-test.js
 *   k6 run -e SCENARIO=peakLoad auth-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { config } from './config.js';

// Custom metrics
const loginDuration = new Trend('auth_login_duration', true);
const refreshDuration = new Trend('auth_refresh_duration', true);
const logoutDuration = new Trend('auth_logout_duration', true);
const failedRequests = new Counter('auth_failed_requests');
const successRate = new Rate('auth_success_rate');

// Select scenario
const selectedScenario = __ENV.SCENARIO || 'smokeTest';
const scenario = config.scenarios[selectedScenario];

if (!scenario) {
  throw new Error(`Unknown scenario: ${selectedScenario}`);
}

export const options = {
  scenarios: {
    [selectedScenario]: scenario,
  },
  thresholds: {
    auth_login_duration: ['p(95)<1000'],
    auth_refresh_duration: ['p(95)<500'],
    auth_logout_duration: ['p(95)<500'],
    auth_success_rate: ['rate>0.99'],
  },
};

export default function () {
  const baseUrl = config.baseUrl;
  let accessToken = null;
  let refreshToken = null;

  // Test 1: Login
  group('Login', () => {
    const loginUrl = `${baseUrl}/auth/login`;
    const payload = JSON.stringify({
      username: config.testUser.username,
      password: config.testUser.password,
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    const response = http.post(loginUrl, payload, params);
    loginDuration.add(response.timings.duration);

    const success = check(response, {
      'login status 200': (r) => r.status === 200,
      'login has accessToken': (r) => {
        try {
          const body = JSON.parse(r.body);
          accessToken = body.accessToken;
          refreshToken = body.refreshToken;
          return accessToken !== undefined;
        } catch {
          return false;
        }
      },
      'login < 1000ms': (r) => r.timings.duration < 1000,
    });

    successRate.add(success);
    if (!success) failedRequests.add(1);
  });

  sleep(1);

  // Test 2: Get Current User (verify token works)
  if (accessToken) {
    group('Get Current User', () => {
      const meUrl = `${baseUrl}/auth/me`;
      const params = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      };

      const response = http.get(meUrl, params);

      const success = check(response, {
        'me status 200': (r) => r.status === 200,
        'me has user data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.id !== undefined || body.username !== undefined;
          } catch {
            return false;
          }
        },
        'me < 500ms': (r) => r.timings.duration < 500,
      });

      successRate.add(success);
      if (!success) failedRequests.add(1);
    });

    sleep(1);
  }

  // Test 3: Token Refresh
  if (refreshToken) {
    group('Token Refresh', () => {
      const refreshUrl = `${baseUrl}/auth/refresh`;
      const payload = JSON.stringify({ refreshToken });
      const params = {
        headers: { 'Content-Type': 'application/json' },
      };

      const response = http.post(refreshUrl, payload, params);
      refreshDuration.add(response.timings.duration);

      const success = check(response, {
        'refresh status 200': (r) => r.status === 200,
        'refresh has new accessToken': (r) => {
          try {
            const body = JSON.parse(r.body);
            if (body.accessToken) {
              accessToken = body.accessToken;
              return true;
            }
            return false;
          } catch {
            return false;
          }
        },
        'refresh < 500ms': (r) => r.timings.duration < 500,
      });

      successRate.add(success);
      if (!success) failedRequests.add(1);
    });

    sleep(1);
  }

  // Test 4: Logout
  if (accessToken) {
    group('Logout', () => {
      const logoutUrl = `${baseUrl}/auth/logout`;
      const params = {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      };

      const response = http.post(logoutUrl, null, params);
      logoutDuration.add(response.timings.duration);

      const success = check(response, {
        'logout status 200': (r) => r.status === 200,
        'logout < 500ms': (r) => r.timings.duration < 500,
      });

      successRate.add(success);
      if (!success) failedRequests.add(1);
    });
  }

  sleep(2);
}
