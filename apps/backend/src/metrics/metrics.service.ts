import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
    @InjectMetric('active_connections')
    private readonly activeConnections: Gauge<string>,
    @InjectMetric('websocket_connections_total')
    private readonly websocketConnections: Gauge<string>,
  ) {}

  incrementRequest(method: string, path: string, status: number): void {
    this.requestCounter.inc({
      method,
      path: this.normalizePath(path),
      status: status.toString(),
    });
  }

  observeRequestDuration(method: string, path: string, duration: number): void {
    this.requestDuration.observe(
      {
        method,
        path: this.normalizePath(path),
      },
      duration,
    );
  }

  incrementActiveConnections(): void {
    this.activeConnections.inc();
  }

  decrementActiveConnections(): void {
    this.activeConnections.dec();
  }

  setWebsocketConnections(namespace: string, count: number): void {
    this.websocketConnections.set({ namespace }, count);
  }

  private normalizePath(path: string): string {
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:uuid');
  }
}
