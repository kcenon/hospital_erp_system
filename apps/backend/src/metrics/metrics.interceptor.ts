import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = process.hrtime.bigint();

    const method = request.method;
    const path = request.route?.path || request.path;

    if (path === '/metrics' || path === '/health') {
      return next.handle();
    }

    this.metricsService.incrementActiveConnections();

    return next.handle().pipe(
      tap(() => {
        const duration = this.calculateDuration(startTime);
        const statusCode = response.statusCode;

        this.metricsService.incrementRequest(method, path, statusCode);
        this.metricsService.observeRequestDuration(method, path, duration);
        this.metricsService.decrementActiveConnections();
      }),
      catchError((error) => {
        const duration = this.calculateDuration(startTime);
        const statusCode = error.status || 500;

        this.metricsService.incrementRequest(method, path, statusCode);
        this.metricsService.observeRequestDuration(method, path, duration);
        this.metricsService.decrementActiveConnections();

        throw error;
      }),
    );
  }

  private calculateDuration(startTime: bigint): number {
    const endTime = process.hrtime.bigint();
    return Number(endTime - startTime) / 1e9;
  }
}
