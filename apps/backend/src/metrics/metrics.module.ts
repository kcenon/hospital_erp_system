import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { MetricsInterceptor } from './metrics.interceptor';
import {
  HTTP_REQUESTS_TOTAL,
  HTTP_REQUEST_DURATION_SECONDS,
  ACTIVE_CONNECTIONS,
  WEBSOCKET_CONNECTIONS,
} from './metrics.constants';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    MetricsService,
    MetricsInterceptor,
    HTTP_REQUESTS_TOTAL,
    HTTP_REQUEST_DURATION_SECONDS,
    ACTIVE_CONNECTIONS,
    WEBSOCKET_CONNECTIONS,
  ],
  exports: [MetricsService, MetricsInterceptor],
})
export class MetricsModule {}
