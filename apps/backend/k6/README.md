# k6 Performance Tests

Performance and load testing suite for Hospital ERP System API.

## Prerequisites

Install k6 on your system:

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6

# Docker
docker pull grafana/k6
```

## Test Scripts

| Script                | Description                                     |
| --------------------- | ----------------------------------------------- |
| `api-load-test.js`    | Core API endpoints (patients, rooms, dashboard) |
| `auth-test.js`        | Authentication flow (login, refresh, logout)    |
| `vital-signs-test.js` | Vital signs recording and retrieval             |

## Usage

### Quick Start

```bash
# Run smoke test (1 VU, 30 seconds)
npm run test:perf

# Run specific test
npm run test:perf:api
npm run test:perf:auth
npm run test:perf:vitals
```

### Running with Different Scenarios

```bash
# Smoke test (default) - quick validation
k6 run api-load-test.js

# Normal load - 50 concurrent users for 5 minutes
k6 run -e SCENARIO=normalLoad api-load-test.js

# Peak load - ramp up to 100 users
k6 run -e SCENARIO=peakLoad api-load-test.js

# Stress test - find breaking point (up to 200 users)
k6 run -e SCENARIO=stressTest api-load-test.js
```

### Custom Configuration

```bash
# Custom base URL
k6 run -e BASE_URL=http://localhost:3001 api-load-test.js

# Custom credentials
k6 run -e TEST_USERNAME=testuser -e TEST_PASSWORD=testpass api-load-test.js

# Generate HTML report
k6 run --out json=results.json api-load-test.js
```

## Performance Targets

Based on SDS requirements (REQ-NFR-001~003, REQ-NFR-005):

| Metric              | Target                     |
| ------------------- | -------------------------- |
| Page Load Time      | < 3 seconds                |
| API Response Time   | < 500ms (95th percentile)  |
| Login Response Time | < 1000ms (95th percentile) |
| Concurrent Users    | 100+                       |
| Error Rate          | < 1%                       |

## Test Scenarios

### Smoke Test

- **VUs**: 1
- **Duration**: 30 seconds
- **Purpose**: Quick validation that tests work

### Normal Load

- **VUs**: 50 (constant)
- **Duration**: 5 minutes
- **Purpose**: Verify performance under typical load

### Peak Load

- **VUs**: 0 → 100 → 0
- **Duration**: 9 minutes (ramp-up, sustain, ramp-down)
- **Purpose**: Verify 100 concurrent user requirement

### Stress Test

- **VUs**: 0 → 50 → 100 → 150 → 200 → 0
- **Duration**: 10 minutes
- **Purpose**: Find system limits

## Interpreting Results

### Key Metrics

- **http_req_duration**: Time from request start to response end
  - p(95) < 500ms is the target
- **http_req_failed**: Percentage of failed requests
  - Should be < 1%
- **http_reqs**: Total number of requests made
- **vus**: Number of virtual users during test

### Sample Output

```
✓ patient list status 200
✓ patient list < 500ms

checks.........................: 100.00% ✓ 1000  ✗ 0
http_req_duration...............: avg=123ms min=45ms med=110ms max=456ms p(90)=234ms p(95)=345ms
http_req_failed.................: 0.00%   ✓ 0     ✗ 1000
http_reqs.......................: 1000    33.33/s
```

## Troubleshooting

### Test user authentication fails

Ensure the test user exists in the database:

```sql
-- Check test user
SELECT * FROM auth.users WHERE username = 'admin';
```

### No admission found for vital signs test

Seed test data with active admissions:

```bash
npm run db:seed
```

### Connection refused

Ensure the backend server is running:

```bash
npm run dev
```

## CI/CD Integration

See `.github/workflows/performance.yml` for GitHub Actions integration (to be added in issue #104).
