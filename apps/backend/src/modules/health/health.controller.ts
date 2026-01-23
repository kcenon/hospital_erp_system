import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthCheckResult } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint for Kubernetes probes' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live() {
    return this.healthService.live();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready to accept traffic' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  ready(): Promise<HealthCheckResult> {
    return this.healthService.ready();
  }
}
