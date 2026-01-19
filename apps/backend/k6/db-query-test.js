/**
 * Database Query Performance Test Script
 *
 * Tests database query performance through API endpoints.
 * SDS Reference: Section 2.1 (Design Goals)
 * Requirements: REQ-NFR-002, REQ-NFR-003
 *
 * Performance Targets:
 * - Database Query: < 100ms
 * - Patient Search: < 100ms
 * - Room Status Query: < 100ms
 *
 * Focus Areas:
 * - Patient search queries (name, patient number, phone)
 * - Room status aggregation queries
 * - Dashboard data queries
 *
 * Usage:
 *   k6 run db-query-test.js                    # Default smoke test
 *   k6 run -e SCENARIO=normalLoad db-query-test.js
 *   k6 run -e SCENARIO=stressTest db-query-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { config } from './config.js';
import { login, authHeaders, randomInt, randomElement } from './helpers.js';

// Custom metrics for database query performance
const patientSearchDuration = new Trend('db_patient_search_duration', true);
const patientListDuration = new Trend('db_patient_list_duration', true);
const patientByIdDuration = new Trend('db_patient_by_id_duration', true);
const roomDashboardDuration = new Trend('db_room_dashboard_duration', true);
const buildingListDuration = new Trend('db_building_list_duration', true);
const floorListDuration = new Trend('db_floor_list_duration', true);
const roomListDuration = new Trend('db_room_list_duration', true);
const admissionListDuration = new Trend('db_admission_list_duration', true);

const querySuccessRate = new Rate('db_query_success_rate');
const slowQueries = new Counter('db_slow_queries');
const failedQueries = new Counter('db_failed_queries');

// Database query specific scenarios
const dbScenarios = {
  smokeTest: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
  },
  normalLoad: {
    executor: 'constant-vus',
    vus: 20,
    duration: '3m',
  },
  peakLoad: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 30 },
      { duration: '2m', target: 50 },
      { duration: '1m', target: 50 },
      { duration: '1m', target: 0 },
    ],
  },
  stressTest: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 30 },
      { duration: '1m', target: 60 },
      { duration: '1m', target: 90 },
      { duration: '1m', target: 120 },
      { duration: '1m', target: 0 },
    ],
  },
};

const selectedScenario = __ENV.SCENARIO || 'smokeTest';
const scenario = dbScenarios[selectedScenario];

if (!scenario) {
  throw new Error(
    `Unknown scenario: ${selectedScenario}. Available: ${Object.keys(dbScenarios).join(', ')}`,
  );
}

// Target query time: 100ms
const QUERY_TARGET_MS = 100;

export const options = {
  scenarios: {
    [selectedScenario]: scenario,
  },
  thresholds: {
    db_patient_search_duration: ['p(95)<100', 'p(99)<200'],
    db_patient_list_duration: ['p(95)<100', 'p(99)<200'],
    db_patient_by_id_duration: ['p(95)<100', 'p(99)<200'],
    db_room_dashboard_duration: ['p(95)<100', 'p(99)<200'],
    db_building_list_duration: ['p(95)<100', 'p(99)<200'],
    db_floor_list_duration: ['p(95)<100', 'p(99)<200'],
    db_room_list_duration: ['p(95)<100', 'p(99)<200'],
    db_admission_list_duration: ['p(95)<100', 'p(99)<200'],
    db_query_success_rate: ['rate>0.99'],
    db_slow_queries: ['count<10'], // Allow fewer than 10 slow queries
  },
};

/**
 * Check if query time exceeds target
 */
function checkQueryTime(duration, queryName) {
  if (duration > QUERY_TARGET_MS) {
    slowQueries.add(1);
    console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
    return false;
  }
  return true;
}

// Setup: authenticate and gather test data
export function setup() {
  console.log(`Running DB Query test scenario: ${selectedScenario}`);
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Target query time: ${QUERY_TARGET_MS}ms`);

  const token = login();
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // Gather some IDs for subsequent tests
  let patientIds = [];
  let buildingIds = [];
  let floorIds = [];
  let roomIds = [];

  // Get patient IDs
  const patientsResponse = http.get(`${config.baseUrl}/patients?page=1&limit=10`, params);
  if (patientsResponse.status === 200) {
    try {
      const body = JSON.parse(patientsResponse.body);
      patientIds = (body.data || []).map((p) => p.id).filter(Boolean);
      console.log(`Found ${patientIds.length} patients for testing`);
    } catch {
      console.warn('Could not parse patients response');
    }
  }

  // Get building IDs
  const buildingsResponse = http.get(`${config.baseUrl}/rooms/buildings`, params);
  if (buildingsResponse.status === 200) {
    try {
      const buildings = JSON.parse(buildingsResponse.body);
      buildingIds = buildings.map((b) => b.id).filter(Boolean);
      console.log(`Found ${buildingIds.length} buildings for testing`);

      // Get floors from first building
      if (buildingIds.length > 0) {
        const floorsResponse = http.get(
          `${config.baseUrl}/rooms/buildings/${buildingIds[0]}/floors`,
          params,
        );
        if (floorsResponse.status === 200) {
          try {
            const floors = JSON.parse(floorsResponse.body);
            floorIds = floors.map((f) => f.id).filter(Boolean);
            console.log(`Found ${floorIds.length} floors for testing`);

            // Get rooms from first floor
            if (floorIds.length > 0) {
              const roomsResponse = http.get(
                `${config.baseUrl}/rooms/floors/${floorIds[0]}/rooms`,
                params,
              );
              if (roomsResponse.status === 200) {
                try {
                  const rooms = JSON.parse(roomsResponse.body);
                  roomIds = rooms.map((r) => r.id).filter(Boolean);
                  console.log(`Found ${roomIds.length} rooms for testing`);
                } catch {
                  // Ignore
                }
              }
            }
          } catch {
            // Ignore
          }
        }
      }
    } catch {
      console.warn('Could not parse buildings response');
    }
  }

  console.log('Setup completed');

  return {
    token,
    patientIds,
    buildingIds,
    floorIds,
    roomIds,
  };
}

// Main test function
export default function (data) {
  const params = authHeaders(data.token);
  const baseUrl = config.baseUrl;

  // Test 1: Patient Search Query (uses text search index)
  group('Patient Search Query', () => {
    const searchTerms = ['김', '이', '박', '최', '정', 'P-2024', 'P-2025'];
    const searchTerm = randomElement(searchTerms);
    const url = `${baseUrl}/patients/search?q=${encodeURIComponent(searchTerm)}`;

    const response = http.get(url, params);
    const duration = response.timings.duration;

    patientSearchDuration.add(duration);

    const passed = check(response, {
      'patient search status 200': (r) => r.status === 200,
      'patient search < 100ms': (r) => r.timings.duration < QUERY_TARGET_MS,
    });

    querySuccessRate.add(passed);
    if (!passed) {
      failedQueries.add(1);
    }
    checkQueryTime(duration, `Patient Search (q=${searchTerm})`);
  });

  sleep(0.5);

  // Test 2: Patient List Query (uses pagination, sorting, filtering)
  group('Patient List Query', () => {
    const pages = [1, 2, 3];
    const limits = [10, 20, 50];
    const sortFields = ['createdAt', 'name', 'patientNumber'];

    const page = randomElement(pages);
    const limit = randomElement(limits);
    const sortBy = randomElement(sortFields);

    const url = `${baseUrl}/patients?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=desc`;
    const response = http.get(url, params);
    const duration = response.timings.duration;

    patientListDuration.add(duration);

    const passed = check(response, {
      'patient list status 200': (r) => r.status === 200,
      'patient list < 100ms': (r) => r.timings.duration < QUERY_TARGET_MS,
      'patient list has pagination': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.total !== undefined && body.data !== undefined;
        } catch {
          return false;
        }
      },
    });

    querySuccessRate.add(passed);
    if (!passed) {
      failedQueries.add(1);
    }
    checkQueryTime(duration, `Patient List (page=${page}, limit=${limit})`);
  });

  sleep(0.5);

  // Test 3: Patient By ID Query (single record lookup)
  if (data.patientIds && data.patientIds.length > 0) {
    group('Patient By ID Query', () => {
      const patientId = randomElement(data.patientIds);
      const url = `${baseUrl}/patients/${patientId}`;

      const response = http.get(url, params);
      const duration = response.timings.duration;

      patientByIdDuration.add(duration);

      const passed = check(response, {
        'patient by id status 200': (r) => r.status === 200,
        'patient by id < 100ms': (r) => r.timings.duration < QUERY_TARGET_MS,
      });

      querySuccessRate.add(passed);
      if (!passed) {
        failedQueries.add(1);
      }
      checkQueryTime(duration, `Patient By ID (${patientId})`);
    });

    sleep(0.5);
  }

  // Test 4: Building List Query
  group('Building List Query', () => {
    const url = `${baseUrl}/rooms/buildings`;
    const response = http.get(url, params);
    const duration = response.timings.duration;

    buildingListDuration.add(duration);

    const passed = check(response, {
      'building list status 200': (r) => r.status === 200,
      'building list < 100ms': (r) => r.timings.duration < QUERY_TARGET_MS,
    });

    querySuccessRate.add(passed);
    if (!passed) {
      failedQueries.add(1);
    }
    checkQueryTime(duration, 'Building List');
  });

  sleep(0.5);

  // Test 5: Floor List Query (hierarchical join)
  if (data.buildingIds && data.buildingIds.length > 0) {
    group('Floor List Query', () => {
      const buildingId = randomElement(data.buildingIds);
      const url = `${baseUrl}/rooms/buildings/${buildingId}/floors`;

      const response = http.get(url, params);
      const duration = response.timings.duration;

      floorListDuration.add(duration);

      const passed = check(response, {
        'floor list status 200': (r) => r.status === 200,
        'floor list < 100ms': (r) => r.timings.duration < QUERY_TARGET_MS,
      });

      querySuccessRate.add(passed);
      if (!passed) {
        failedQueries.add(1);
      }
      checkQueryTime(duration, `Floor List (building=${buildingId})`);
    });

    sleep(0.5);
  }

  // Test 6: Room List Query (with bed aggregation)
  if (data.floorIds && data.floorIds.length > 0) {
    group('Room List Query', () => {
      const floorId = randomElement(data.floorIds);
      const url = `${baseUrl}/rooms/floors/${floorId}/rooms`;

      const response = http.get(url, params);
      const duration = response.timings.duration;

      roomListDuration.add(duration);

      const passed = check(response, {
        'room list status 200': (r) => r.status === 200,
        'room list < 100ms': (r) => r.timings.duration < QUERY_TARGET_MS,
      });

      querySuccessRate.add(passed);
      if (!passed) {
        failedQueries.add(1);
      }
      checkQueryTime(duration, `Room List (floor=${floorId})`);
    });

    sleep(0.5);
  }

  // Test 7: Room Dashboard Query (complex aggregation)
  if (data.buildingIds && data.buildingIds.length > 0) {
    group('Room Dashboard Query', () => {
      const buildingId = randomElement(data.buildingIds);
      const url = `${baseUrl}/rooms/dashboard/building/${buildingId}`;

      const response = http.get(url, params);
      const duration = response.timings.duration;

      roomDashboardDuration.add(duration);

      const passed = check(response, {
        'room dashboard status 200': (r) => r.status === 200 || r.status === 404,
        'room dashboard < 100ms': (r) => r.timings.duration < QUERY_TARGET_MS,
      });

      querySuccessRate.add(passed);
      if (!passed) {
        failedQueries.add(1);
      }
      checkQueryTime(duration, `Room Dashboard (building=${buildingId})`);
    });

    sleep(0.5);
  }

  // Test 8: Admission List Query (with relations)
  group('Admission List Query', () => {
    const url = `${baseUrl}/admissions?page=1&limit=20&status=ACTIVE`;
    const response = http.get(url, params);
    const duration = response.timings.duration;

    admissionListDuration.add(duration);

    const passed = check(response, {
      'admission list status 200': (r) => r.status === 200,
      'admission list < 100ms': (r) => r.timings.duration < QUERY_TARGET_MS,
    });

    querySuccessRate.add(passed);
    if (!passed) {
      failedQueries.add(1);
    }
    checkQueryTime(duration, 'Admission List');
  });

  sleep(randomInt(1, 2));
}

// Teardown
export function teardown(data) {
  console.log('Database query test completed');
  console.log('\n=== Query Performance Summary ===');
  console.log(`Target: All queries < ${QUERY_TARGET_MS}ms at p95`);
  console.log('Review the detailed metrics above for optimization recommendations.');
}
