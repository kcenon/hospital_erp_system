/**
 * API Load Test Script
 *
 * Tests core API endpoints under load to verify performance requirements.
 * SDS Reference: Section 2.1 (Design Goals)
 * Requirements: REQ-NFR-001~003, REQ-NFR-005
 *
 * Performance Targets:
 * - API Response Time: < 500ms (95th percentile)
 * - Concurrent Users: 100+
 * - Error Rate: < 1%
 *
 * Usage:
 *   k6 run api-load-test.js                    # Default smoke test
 *   k6 run -e SCENARIO=normalLoad api-load-test.js
 *   k6 run -e SCENARIO=peakLoad api-load-test.js
 *   k6 run -e SCENARIO=stressTest api-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { config } from './config.js';
import { login, authHeaders, checkResponseTime, randomInt } from './helpers.js';

// Custom metrics
const loginDuration = new Trend('login_duration', true);
const patientListDuration = new Trend('patient_list_duration', true);
const patientSearchDuration = new Trend('patient_search_duration', true);
const roomDashboardDuration = new Trend('room_dashboard_duration', true);
const failedRequests = new Counter('failed_requests');
const successRate = new Rate('success_rate');

// Select scenario based on environment variable
const selectedScenario = __ENV.SCENARIO || 'smokeTest';
const scenario = config.scenarios[selectedScenario];

if (!scenario) {
  throw new Error(
    `Unknown scenario: ${selectedScenario}. Available: ${Object.keys(config.scenarios).join(', ')}`,
  );
}

// Use relaxed thresholds for smoke tests (CI cold start delays)
const baseThresholds =
  selectedScenario === 'smokeTest' ? config.smokeTestThresholds : config.thresholds;

export const options = {
  scenarios: {
    [selectedScenario]: scenario,
  },
  thresholds: {
    ...baseThresholds,
    login_duration: ['p(95)<1000'], // Login can be slightly slower
    patient_list_duration: ['p(95)<500'],
    patient_search_duration: ['p(95)<500'],
    room_dashboard_duration: ['p(95)<500'],
    success_rate: selectedScenario === 'smokeTest' ? ['rate>0.95'] : ['rate>0.99'],
  },
};

// Setup: authenticate once per VU
export function setup() {
  console.log(`Running scenario: ${selectedScenario}`);
  console.log(`Base URL: ${config.baseUrl}`);

  // Verify server is accessible
  const healthCheck = http.get(`${config.baseUrl}/`);
  if (healthCheck.status !== 200 && healthCheck.status !== 404) {
    console.warn(`Server health check returned status: ${healthCheck.status}`);
  }

  // Test login
  const token = login();
  console.log('Setup completed: authentication successful');

  return { token };
}

// Main test function
export default function (data) {
  const params = authHeaders(data.token);
  const baseUrl = config.baseUrl;

  // Test 1: Patient List API
  group('Patient List API', () => {
    const url = `${baseUrl}/patients?page=1&limit=20`;
    const response = http.get(url, params);

    patientListDuration.add(response.timings.duration);

    const success = check(response, {
      'patient list status 200': (r) => r.status === 200,
      'patient list has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined || body.patients !== undefined;
        } catch {
          return false;
        }
      },
      'patient list < 500ms': (r) => r.timings.duration < 500,
    });

    successRate.add(success);
    if (!success) failedRequests.add(1);
  });

  sleep(randomInt(1, 2));

  // Test 2: Patient Search API
  group('Patient Search API', () => {
    const searchTerms = ['김', '이', '박', '최', '정'];
    const searchTerm = searchTerms[randomInt(0, searchTerms.length - 1)];
    const url = `${baseUrl}/patients/search?q=${encodeURIComponent(searchTerm)}`;
    const response = http.get(url, params);

    patientSearchDuration.add(response.timings.duration);

    const success = check(response, {
      'patient search status 200': (r) => r.status === 200,
      'patient search < 500ms': (r) => r.timings.duration < 500,
    });

    successRate.add(success);
    if (!success) failedRequests.add(1);
  });

  sleep(randomInt(1, 2));

  // Test 3: Room Dashboard API
  group('Room Dashboard API', () => {
    // First get buildings to find valid IDs
    const buildingsUrl = `${baseUrl}/rooms/buildings`;
    const buildingsResponse = http.get(buildingsUrl, params);

    const buildingsSuccess = check(buildingsResponse, {
      'buildings list status 200': (r) => r.status === 200,
    });

    if (buildingsSuccess && buildingsResponse.status === 200) {
      try {
        const buildings = JSON.parse(buildingsResponse.body);
        if (buildings && buildings.length > 0) {
          const buildingId = buildings[0].id;

          // Get floor dashboard
          const dashboardUrl = `${baseUrl}/rooms/dashboard/building/${buildingId}`;
          const dashboardResponse = http.get(dashboardUrl, params);

          roomDashboardDuration.add(dashboardResponse.timings.duration);

          const success = check(dashboardResponse, {
            'room dashboard status 200': (r) => r.status === 200,
            'room dashboard < 500ms': (r) => r.timings.duration < 500,
          });

          successRate.add(success);
          if (!success) failedRequests.add(1);
        }
      } catch (e) {
        console.error('Failed to parse buildings response:', e.message);
        failedRequests.add(1);
      }
    } else {
      // Fallback: just test the all buildings dashboard
      const allDashboardUrl = `${baseUrl}/rooms/dashboard/buildings`;
      const response = http.get(allDashboardUrl, params);

      roomDashboardDuration.add(response.timings.duration);

      const success = check(response, {
        'all buildings dashboard status 200': (r) => r.status === 200,
        'all buildings dashboard < 500ms': (r) => r.timings.duration < 500,
      });

      successRate.add(success);
      if (!success) failedRequests.add(1);
    }
  });

  sleep(randomInt(1, 3));
}

// Teardown
export function teardown(data) {
  console.log('Test completed');
}
