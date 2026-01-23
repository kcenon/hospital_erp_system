/**
 * k6 Helper Functions
 *
 * Common utilities for k6 test scripts.
 */

import http from 'k6/http';
import { check, fail } from 'k6';
import { config } from './config.js';

/**
 * Authenticate and return access token
 * @returns {string} JWT access token
 */
export function login() {
  const loginUrl = `${config.baseUrl}/auth/login`;
  const payload = JSON.stringify({
    username: config.testUser.username,
    password: config.testUser.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(loginUrl, payload, params);

  const loginSuccess = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login has access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        // Support both direct accessToken and nested tokens.accessToken
        return body.accessToken !== undefined || body.tokens?.accessToken !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    fail(`Login failed: ${response.status} - ${response.body}`);
  }

  const body = JSON.parse(response.body);
  // Support both direct accessToken and nested tokens.accessToken
  return body.accessToken || body.tokens?.accessToken;
}

/**
 * Create authenticated request headers
 * @param {string} token - JWT access token
 * @returns {object} Request headers with authorization
 */
export function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Standard response time check
 * @param {object} response - HTTP response object
 * @param {string} name - Check name prefix
 * @param {number} maxDuration - Maximum allowed duration in ms (default: 500)
 * @returns {boolean} Whether all checks passed
 */
export function checkResponseTime(response, name, maxDuration = 500) {
  return check(response, {
    [`${name} status is 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${name} duration < ${maxDuration}ms`]: (r) => r.timings.duration < maxDuration,
  });
}

/**
 * Generate random integer within range
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random integer
 * @note Uses Math.random() which is not cryptographically secure.
 *       This is acceptable for load testing purposes where we only need
 *       pseudo-random test data generation, not security-sensitive operations.
 */
export function randomInt(min, max) {
  // lgtm[js/insecure-randomness] - Used for test data generation only, not security
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick random element from array
 * @param {Array} arr - Source array
 * @returns {*} Random element
 */
export function randomElement(arr) {
  return arr[randomInt(0, arr.length - 1)];
}
