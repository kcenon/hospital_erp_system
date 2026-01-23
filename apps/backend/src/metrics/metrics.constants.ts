import {
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';

export const HTTP_REQUESTS_TOTAL = makeCounterProvider({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
});

export const HTTP_REQUEST_DURATION_SECONDS = makeHistogramProvider({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10],
});

export const ACTIVE_CONNECTIONS = makeGaugeProvider({
  name: 'active_connections',
  help: 'Number of active HTTP connections',
});

export const WEBSOCKET_CONNECTIONS = makeGaugeProvider({
  name: 'websocket_connections_total',
  help: 'Total number of active WebSocket connections',
  labelNames: ['namespace'],
});
