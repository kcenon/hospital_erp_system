/**
 * Vital Signs Recording Load Test Script
 *
 * Tests vital signs recording API under load.
 * SDS Reference: Section 4.5 (Report Module)
 * Requirements: REQ-FR-030~035, REQ-NFR-002
 *
 * Performance Targets:
 * - Vital Recording: < 500ms (95th percentile)
 * - Vital History: < 500ms (95th percentile)
 * - Error Rate: < 1%
 *
 * Usage:
 *   k6 run vital-signs-test.js
 *   k6 run -e SCENARIO=normalLoad vital-signs-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { config } from './config.js';
import { login, authHeaders, randomInt } from './helpers.js';

// Custom metrics
const vitalRecordDuration = new Trend('vital_record_duration', true);
const vitalHistoryDuration = new Trend('vital_history_duration', true);
const vitalLatestDuration = new Trend('vital_latest_duration', true);
const failedRequests = new Counter('vital_failed_requests');
const successRate = new Rate('vital_success_rate');

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
    vital_record_duration: ['p(95)<500'],
    vital_history_duration: ['p(95)<500'],
    vital_latest_duration: ['p(95)<500'],
    vital_success_rate: ['rate>0.99'],
  },
};

// Setup: get token and find an admission ID
export function setup() {
  const token = login();
  const params = authHeaders(token);
  const baseUrl = config.baseUrl;

  // Find an existing admission to use for testing
  let admissionId = null;

  // Try to get admissions list
  const admissionsUrl = `${baseUrl}/admissions?status=ACTIVE&limit=1`;
  const admissionsResponse = http.get(admissionsUrl, params);

  if (admissionsResponse.status === 200) {
    try {
      const body = JSON.parse(admissionsResponse.body);
      const admissions = body.data || body.admissions || body;
      if (Array.isArray(admissions) && admissions.length > 0) {
        admissionId = admissions[0].id;
        console.log(`Found admission ID: ${admissionId}`);
      }
    } catch (e) {
      console.error('Failed to parse admissions response');
    }
  }

  // Fallback: try to get from patients with active admissions
  if (!admissionId) {
    const patientsUrl = `${baseUrl}/patients?hasActiveAdmission=true&limit=1`;
    const patientsResponse = http.get(patientsUrl, params);

    if (patientsResponse.status === 200) {
      try {
        const body = JSON.parse(patientsResponse.body);
        const patients = body.data || body.patients || body;
        if (Array.isArray(patients) && patients.length > 0) {
          const patient = patients[0];
          if (patient.activeAdmission) {
            admissionId = patient.activeAdmission.id;
            console.log(`Found admission ID from patient: ${admissionId}`);
          }
        }
      } catch (e) {
        console.error('Failed to parse patients response');
      }
    }
  }

  if (!admissionId) {
    console.warn(
      'No active admission found. Vital signs tests will be skipped. Please seed test data.',
    );
  }

  return { token, admissionId };
}

// Generate random vital signs within normal ranges
// Note: Uses pseudo-random values for test data, not for security purposes
function generateVitalSigns() {
  // lgtm[js/insecure-randomness] - Used for test data generation only, not security
  const tempVariation = Math.random() * 1.5;
  return {
    temperature: (36.0 + tempVariation).toFixed(1), // 36.0 - 37.5
    systolicBp: randomInt(100, 140),
    diastolicBp: randomInt(60, 90),
    heartRate: randomInt(60, 100),
    respiratoryRate: randomInt(12, 20),
    oxygenSaturation: randomInt(95, 100),
    notes: `Load test vital signs recorded at ${new Date().toISOString()}`,
  };
}

export default function (data) {
  const { token, admissionId } = data;
  const params = authHeaders(token);
  const baseUrl = config.baseUrl;

  if (!admissionId) {
    // Skip tests if no admission available
    sleep(1);
    return;
  }

  // Test 1: Get Vital Signs History
  group('Vital Signs History', () => {
    const url = `${baseUrl}/admissions/${admissionId}/vitals?page=1&limit=20`;
    const response = http.get(url, params);

    vitalHistoryDuration.add(response.timings.duration);

    const success = check(response, {
      'vital history status 200': (r) => r.status === 200,
      'vital history < 500ms': (r) => r.timings.duration < 500,
    });

    successRate.add(success);
    if (!success) failedRequests.add(1);
  });

  sleep(randomInt(1, 2));

  // Test 2: Get Latest Vital Signs
  group('Latest Vital Signs', () => {
    const url = `${baseUrl}/admissions/${admissionId}/vitals/latest`;
    const response = http.get(url, params);

    vitalLatestDuration.add(response.timings.duration);

    const success = check(response, {
      'vital latest status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'vital latest < 500ms': (r) => r.timings.duration < 500,
    });

    successRate.add(success);
    if (!success) failedRequests.add(1);
  });

  sleep(randomInt(1, 2));

  // Test 3: Record Vital Signs (only in some iterations to avoid too many writes)
  if (randomInt(1, 10) <= 2) {
    // 20% of iterations
    group('Record Vital Signs', () => {
      const url = `${baseUrl}/admissions/${admissionId}/vitals`;
      const payload = JSON.stringify(generateVitalSigns());

      const response = http.post(url, payload, params);

      vitalRecordDuration.add(response.timings.duration);

      const success = check(response, {
        'vital record status 201 or 200': (r) => r.status === 201 || r.status === 200,
        'vital record < 500ms': (r) => r.timings.duration < 500,
      });

      successRate.add(success);
      if (!success) failedRequests.add(1);
    });
  }

  sleep(randomInt(2, 4));
}

export function teardown(data) {
  console.log('Vital signs test completed');
}
