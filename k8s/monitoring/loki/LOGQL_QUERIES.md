# LogQL Query Examples

This document provides common LogQL queries for the Hospital ERP System.

## Basic Queries

### View All Logs from Hospital ERP System

```logql
{namespace="hospital-erp-system"}
```

### View Backend Logs Only

```logql
{namespace="hospital-erp-system", app="backend"}
```

### View Frontend Logs Only

```logql
{namespace="hospital-erp-system", app="frontend"}
```

## Error and Warning Queries

### All Error Logs

```logql
{namespace="hospital-erp-system"} |= "error"
```

### Error Logs from Backend

```logql
{namespace="hospital-erp-system", app="backend"} | json | level="error"
```

### Warning and Error Logs

```logql
{namespace="hospital-erp-system"} | json | level=~"warn|error"
```

## Contextual Queries

### Logs from Specific Service/Context

```logql
{namespace="hospital-erp-system"} | json | context="AuthService"
```

```logql
{namespace="hospital-erp-system"} | json | context="PatientService"
```

### Logs from Specific Pod

```logql
{namespace="hospital-erp-system", pod=~"backend-.*"}
```

### Logs with Trace Information

```logql
{namespace="hospital-erp-system"} | json | trace != ""
```

## Rate and Aggregation Queries

### Error Rate (Last 5 Minutes)

```logql
sum(rate({namespace="hospital-erp-system"} | json | level="error" [5m]))
```

### Error Count by Context

```logql
sum by (context) (count_over_time({namespace="hospital-erp-system"} | json | level="error" [1h]))
```

### Log Volume by Application

```logql
sum by (app) (rate({namespace="hospital-erp-system"}[5m]))
```

### Top 10 Error Messages

```logql
topk(10, sum by (msg) (count_over_time({namespace="hospital-erp-system"} | json | level="error" [24h])))
```

## Time-Based Queries

### Logs in Last Hour

```logql
{namespace="hospital-erp-system"} | json | __timestamp__ > 1h
```

### Logs Between Specific Times

```logql
{namespace="hospital-erp-system"} | json
  | __timestamp__ >= "2026-01-24T00:00:00Z"
  | __timestamp__ <= "2026-01-24T23:59:59Z"
```

## Search and Filter Queries

### Search for Specific Text

```logql
{namespace="hospital-erp-system"} |~ "(?i)authentication failed"
```

### Exclude Certain Messages

```logql
{namespace="hospital-erp-system"} != "health check"
```

### Filter JSON Fields

```logql
{namespace="hospital-erp-system"} | json | userId != ""
```

## Advanced Queries

### Failed Authentication Attempts

```logql
{namespace="hospital-erp-system"}
  | json
  | context="AuthService"
  | msg =~ "(?i)failed|unauthorized"
```

### Database Query Errors

```logql
{namespace="hospital-erp-system"}
  | json
  | level="error"
  | msg =~ "(?i)database|query|connection"
```

### Performance Issues (Long Duration)

```logql
{namespace="hospital-erp-system"}
  | json
  | duration > 1000
```

### Correlation ID Tracking

```logql
{namespace="hospital-erp-system"}
  | json
  | correlationId="abc-123-def-456"
```

## Metrics Extraction

### Average Error Rate per Minute

```logql
avg_over_time(
  sum(rate({namespace="hospital-erp-system"} | json | level="error" [1m]))[5m:]
)
```

### P95 Response Time (if duration is logged)

```logql
quantile_over_time(0.95,
  {namespace="hospital-erp-system"}
  | json
  | unwrap duration [5m]
) by (context)
```

## Grafana Dashboard Queries

### Error Rate Panel

```logql
sum(rate({namespace="hospital-erp-system"} | json | level="error" [1m])) by (app)
```

### Log Volume Panel

```logql
sum(rate({namespace="hospital-erp-system"}[1m])) by (app)
```

### Recent Errors Table

```logql
{namespace="hospital-erp-system"}
  | json
  | level="error"
  | line_format "{{.time}} [{{.context}}] {{.msg}}"
```

## Best Practices

1. **Use Label Filters First**: Apply namespace and app labels before JSON parsing

   ```logql
   {namespace="hospital-erp-system", app="backend"} | json | level="error"
   ```

2. **Limit Time Range**: Always specify a time range to avoid scanning too much data

3. **Use Regex Carefully**: Regex operations are expensive, use exact matches when possible

4. **Cache Results**: For dashboards, use appropriate refresh intervals (1m-5m)

5. **Structured Logging**: Ensure backend logs JSON with consistent fields:
   - `level` (info, warn, error, debug)
   - `msg` (message text)
   - `context` (service/module name)
   - `time` (ISO 8601 timestamp)
   - `trace` (stack trace for errors)

## Common Alerts

### High Error Rate

```logql
sum(rate({namespace="hospital-erp-system"} | json | level="error" [5m])) > 10
```

### Service Down (No Logs)

```logql
absent_over_time({namespace="hospital-erp-system", app="backend"}[5m])
```

### Authentication Failures Spike

```logql
sum(rate({namespace="hospital-erp-system"} | json | context="AuthService" | msg =~ "(?i)failed" [5m])) > 5
```

## Retention Configuration

Current retention: **30 days** (720 hours)

Logs older than 30 days are automatically deleted by Loki's compactor.
