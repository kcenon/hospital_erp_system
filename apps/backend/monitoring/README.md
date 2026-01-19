# Performance Monitoring Setup

Grafana-based performance monitoring dashboard for k6 load testing results.

## Prerequisites

- Docker and Docker Compose installed
- Hospital ERP main services running (`docker-compose up`)

## Quick Start

### 1. Start Monitoring Services

```bash
cd apps/backend/monitoring
docker compose -f docker-compose.monitoring.yml up -d
```

### 2. Run k6 Tests with InfluxDB Output

```bash
# From apps/backend directory
k6 run --out influxdb=http://localhost:8086/k6 k6/api-load-test.js

# Or with specific scenario
k6 run --out influxdb=http://localhost:8086/k6 -e SCENARIO=normalLoad k6/api-load-test.js
```

### 3. Access Grafana Dashboard

- URL: http://localhost:3002
- Default credentials: admin / admin
- Dashboard: "Hospital ERP - k6 Performance Dashboard"

## Architecture

```
                    +------------+
                    |   k6       |
                    +-----+------+
                          |
                          | InfluxDB Line Protocol
                          v
                    +------------+
                    | InfluxDB   | (Port 8086)
                    +-----+------+
                          |
                          | Query
                          v
                    +------------+
                    |  Grafana   | (Port 3002)
                    +------------+
```

## Services

| Service  | Port | Description                    |
| -------- | ---- | ------------------------------ |
| InfluxDB | 8086 | Time-series database for k6    |
| Grafana  | 3002 | Visualization and dashboarding |

## Dashboard Panels

### Overview Section

- Average Response Time
- P95 Response Time (SDS Target: < 500ms)
- Error Rate (SDS Target: < 1%)
- Requests per Second
- Maximum Virtual Users
- Total Requests

### Response Times Section

- HTTP Response Time percentiles (mean, p90, p95, p99)
- Virtual Users and Throughput over time

### Custom Metrics Section

- API Endpoint Response Times (Login, Patient List, Room Dashboard)
- WebSocket Performance (Connection, Subscribe, Message Latency)

### Database Performance Section

- Database Query Response Times (Patient Search, Patient List, Room Dashboard, Admission List)

## Running All Test Scenarios

```bash
# Smoke test (quick validation)
k6 run --out influxdb=http://localhost:8086/k6 k6/api-load-test.js

# Normal load (50 VUs, 5 min)
k6 run --out influxdb=http://localhost:8086/k6 -e SCENARIO=normalLoad k6/api-load-test.js

# Peak load (ramp to 100 VUs)
k6 run --out influxdb=http://localhost:8086/k6 -e SCENARIO=peakLoad k6/api-load-test.js

# WebSocket tests
k6 run --out influxdb=http://localhost:8086/k6 k6/websocket-test.js

# Database query tests
k6 run --out influxdb=http://localhost:8086/k6 k6/db-query-test.js
```

## NPM Scripts

Add these scripts to run tests with monitoring:

```bash
# Run from apps/backend directory
npm run test:perf:monitor      # API tests with InfluxDB output
npm run test:perf:ws:monitor   # WebSocket tests with InfluxDB output
npm run test:perf:db:monitor   # DB tests with InfluxDB output
```

## Cleanup

```bash
# Stop monitoring services
docker compose -f docker-compose.monitoring.yml down

# Remove data volumes (reset)
docker compose -f docker-compose.monitoring.yml down -v
```

## Troubleshooting

### InfluxDB Connection Error

Ensure InfluxDB is running and accessible:

```bash
curl http://localhost:8086/ping
```

### No Data in Grafana

1. Verify k6 is outputting to InfluxDB:

   ```bash
   k6 run --out influxdb=http://localhost:8086/k6 k6/api-load-test.js
   ```

2. Check InfluxDB has data:
   ```bash
   curl -G 'http://localhost:8086/query' --data-urlencode 'db=k6' --data-urlencode 'q=SHOW MEASUREMENTS'
   ```

### Network Issues

If using Docker network, ensure k6 can reach InfluxDB:

```bash
# Use Docker network name
k6 run --out influxdb=http://hospital-erp-influxdb:8086/k6 k6/api-load-test.js
```

## Performance Targets (SDS Reference)

| Metric              | Target        | Dashboard Panel       |
| ------------------- | ------------- | --------------------- |
| API Response Time   | < 500ms (p95) | P95 Response Time     |
| Database Query Time | < 100ms (p95) | Database Query Times  |
| WebSocket Latency   | < 3 seconds   | WebSocket Performance |
| Error Rate          | < 1%          | Error Rate            |
| Concurrent Users    | 100+          | Max VUs               |
