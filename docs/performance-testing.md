# Performance Testing Guide

This document describes the performance testing strategy, tools, and procedures for the Hospital ERP System.

## Overview

Performance testing ensures the system meets non-functional requirements defined in the SDS:

| Requirement | Target        | Description                 |
| ----------- | ------------- | --------------------------- |
| REQ-NFR-001 | < 3 seconds   | Page load time              |
| REQ-NFR-002 | < 500ms (p95) | API response time           |
| REQ-NFR-003 | < 3 seconds   | WebSocket broadcast latency |
| REQ-NFR-005 | 100+          | Concurrent users            |

## Test Framework

We use [k6](https://k6.io/) for performance testing due to:

- **JavaScript-based**: Familiar syntax for the development team
- **Protocol support**: HTTP, WebSocket, gRPC
- **Metrics**: Built-in metrics with custom metric support
- **CI/CD integration**: Easy automation with GitHub Actions
- **Scalability**: Can simulate thousands of virtual users

## Test Scripts

Located in `apps/backend/k6/`:

| Script                | Purpose               | Key Metrics                                                |
| --------------------- | --------------------- | ---------------------------------------------------------- |
| `api-load-test.js`    | Core API endpoints    | `patient_list_duration`, `room_dashboard_duration`         |
| `auth-test.js`        | Authentication flow   | `login_duration`, `token_refresh_duration`                 |
| `vital-signs-test.js` | Vital signs API       | `vital_record_duration`, `vital_list_duration`             |
| `websocket-test.js`   | WebSocket performance | `ws_connection_duration`, `ws_message_latency`             |
| `db-query-test.js`    | Database queries      | `db_patient_search_duration`, `db_room_dashboard_duration` |

## Test Scenarios

### Smoke Test (Default)

Quick validation that tests work correctly.

```bash
npm run test:perf
```

- **VUs**: 1
- **Duration**: 30 seconds
- **Use case**: Pre-deployment validation, quick sanity check

### Normal Load

Simulates typical production load.

```bash
npm run test:perf:normal
```

- **VUs**: 50 constant
- **Duration**: 5 minutes
- **Use case**: Daily performance baseline, regression detection

### Peak Load

Verifies the 100 concurrent user requirement.

```bash
npm run test:perf:peak
```

- **VUs**: 0 → 100 → 0 (ramping)
- **Duration**: 9 minutes
- **Use case**: Capacity verification, SLA validation

### Stress Test

Finds the system's breaking point.

```bash
npm run test:perf:stress
```

- **VUs**: 0 → 50 → 100 → 150 → 200 → 0
- **Duration**: 10 minutes
- **Use case**: Capacity planning, identifying bottlenecks

## Running Tests

### Prerequisites

1. Install k6:

   ```bash
   # macOS
   brew install k6

   # Linux (Debian/Ubuntu)
   sudo apt-get install k6

   # Docker
   docker pull grafana/k6
   ```

2. Start the backend server:

   ```bash
   cd apps/backend
   npm run dev
   ```

3. Seed test data:
   ```bash
   npm run db:seed
   ```

### Local Execution

```bash
cd apps/backend

# Run specific test
npm run test:perf:api
npm run test:perf:auth
npm run test:perf:vitals
npm run test:perf:ws
npm run test:perf:db

# Run with specific scenario
k6 run -e SCENARIO=normalLoad k6/api-load-test.js

# Custom configuration
k6 run \
  -e BASE_URL=http://localhost:3000 \
  -e TEST_USERNAME=admin \
  -e TEST_PASSWORD=admin123 \
  k6/api-load-test.js
```

### CI/CD Execution

Performance tests run in GitHub Actions:

- **Automatic**: Daily at 2 AM UTC (smoke test)
- **Manual**: Via workflow dispatch with configurable scenario
- **PR trigger**: Runs smoke test on backend changes

Trigger manually:

1. Go to Actions → Performance Tests
2. Click "Run workflow"
3. Select scenario and test type

## Monitoring Dashboard

### Setup

```bash
cd apps/backend

# Start InfluxDB + Grafana
npm run monitoring:up

# Run tests with monitoring
npm run test:perf:monitor

# Access Grafana
open http://localhost:3002
# Login: admin / admin
```

### Dashboard Features

- Real-time request rate and duration
- Response time percentiles (p50, p90, p95, p99)
- Error rate trends
- Virtual user count
- Custom metrics visualization

### Teardown

```bash
npm run monitoring:down
```

## Interpreting Results

### Key Metrics

| Metric              | Description          | Target             |
| ------------------- | -------------------- | ------------------ |
| `http_req_duration` | Request latency      | p95 < 500ms        |
| `http_req_failed`   | Failed request rate  | < 1%               |
| `checks`            | Assertion pass rate  | > 99%              |
| `vus`               | Active virtual users | Varies by scenario |

### Sample Output

```
✓ patient list status 200
✓ patient list < 500ms

checks.........................: 100.00% ✓ 1000  ✗ 0
http_req_duration...............: avg=123ms min=45ms med=110ms max=456ms p(90)=234ms p(95)=345ms
http_req_failed.................: 0.00%   ✓ 0     ✗ 1000
http_reqs.......................: 1000    33.33/s
```

### Pass/Fail Criteria

Tests fail if:

- p95 response time > 500ms
- Error rate > 1%
- Success rate < 99%

## Troubleshooting

### Common Issues

**Connection refused**

```bash
# Ensure server is running
npm run dev

# Check port
curl http://localhost:3000
```

**Authentication failure**

```bash
# Verify test user exists
psql -c "SELECT * FROM auth.users WHERE username = 'admin'"

# Re-seed if needed
npm run db:seed
```

**No test data**

```bash
# Seed database
npm run db:seed

# Verify data
psql -c "SELECT COUNT(*) FROM patient.patients"
```

### Performance Issues

If tests fail performance thresholds:

1. **Check database indexes**

   ```sql
   EXPLAIN ANALYZE SELECT * FROM patient.patients WHERE name ILIKE '%김%';
   ```

2. **Enable query logging**

   ```typescript
   new PrismaClient({ log: ['query'] });
   ```

3. **Monitor resources**
   ```bash
   docker stats
   htop
   ```

## Baseline Metrics

Last updated: 2026-01-19

### API Endpoints (Smoke Test)

| Endpoint             | p50    | p95    | p99    |
| -------------------- | ------ | ------ | ------ |
| GET /patients        | ~50ms  | ~120ms | ~200ms |
| GET /patients/search | ~80ms  | ~150ms | ~250ms |
| GET /rooms/dashboard | ~100ms | ~200ms | ~350ms |
| POST /auth/login     | ~150ms | ~300ms | ~450ms |

### WebSocket (Smoke Test)

| Metric           | p50    | p95    | p99    |
| ---------------- | ------ | ------ | ------ |
| Connection time  | ~100ms | ~500ms | ~1s    |
| Subscription ack | ~50ms  | ~200ms | ~400ms |
| Message latency  | ~20ms  | ~100ms | ~200ms |

## Best Practices

1. **Run tests consistently**: Use the same scenario for trend comparison
2. **Use realistic data**: Seed production-like data volumes
3. **Isolate test environment**: Avoid interference from other processes
4. **Monitor during tests**: Watch CPU, memory, and database connections
5. **Version control results**: Store baseline metrics for regression detection
6. **Test regularly**: Integrate into CI/CD for continuous performance monitoring

## Related Documentation

- [SDS Section 2.1 - Design Goals](./SDS.md)
- [k6 README](../apps/backend/k6/README.md)
- [Monitoring README](../apps/backend/monitoring/README.md)
