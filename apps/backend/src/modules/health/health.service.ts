import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  checks?: {
    database?: 'ok' | 'error';
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: 'ok',
      },
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      result.status = 'error';
      result.checks!.database = 'error';
      throw new ServiceUnavailableException(result);
    }

    return result;
  }

  live(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async ready(): Promise<HealthCheckResult> {
    return this.check();
  }
}
