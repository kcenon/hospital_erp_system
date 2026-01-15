import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../../prisma';
import { AuthModule } from '../auth';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';
import { AuditQueryService } from './audit-query.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './interceptors';
import { UserAdminRepository } from './user-admin.repository';
import { UserAdminService } from './user-admin.service';
import { UserAdminController } from './user-admin.controller';
import { RoleRepository } from './role.repository';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AuditController, UserAdminController, RoleController],
  providers: [
    AuditRepository,
    AuditService,
    AuditQueryService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    UserAdminRepository,
    UserAdminService,
    RoleRepository,
    RoleService,
  ],
  exports: [AuditService, AuditQueryService, AuditRepository, UserAdminService, RoleService],
})
export class AdminModule {}
