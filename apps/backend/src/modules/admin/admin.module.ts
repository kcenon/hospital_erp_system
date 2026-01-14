import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../../prisma';
import { AuthModule } from '../auth';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';
import { AuditQueryService } from './audit-query.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './interceptors';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AuditController],
  providers: [
    AuditRepository,
    AuditService,
    AuditQueryService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService, AuditQueryService, AuditRepository],
})
export class AdminModule {}
