import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards';
import { PermissionGuard } from '../../auth/guards';
import { RequirePermission } from '../../auth/decorators';
import { Permissions } from '../../auth/constants';
import { PatientSyncService } from './services';
import { LegacyPatientResponseDto, MedicalHistoryResponseDto } from './dto';
import { PatientResponseDto } from '../../patient/dto';

@Controller('patients/legacy')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class LegacyPatientController {
  constructor(private readonly patientSyncService: PatientSyncService) {}

  @Get('search')
  @RequirePermission(Permissions.PATIENT_READ)
  async searchLegacy(@Query('q') query: string): Promise<LegacyPatientResponseDto[]> {
    return this.patientSyncService.searchLegacy(query || '');
  }

  @Get('health')
  @RequirePermission(Permissions.PATIENT_READ)
  async checkConnection(): Promise<{ connected: boolean }> {
    const connected = await this.patientSyncService.checkConnection();
    return { connected };
  }

  @Get(':legacyId')
  @RequirePermission(Permissions.PATIENT_READ)
  async findByLegacyId(@Param('legacyId') legacyId: string): Promise<LegacyPatientResponseDto> {
    return this.patientSyncService.findLegacyById(legacyId);
  }

  @Get(':legacyId/medical-history')
  @RequirePermission(Permissions.PATIENT_READ)
  async getMedicalHistory(@Param('legacyId') legacyId: string): Promise<MedicalHistoryResponseDto> {
    return this.patientSyncService.getMedicalHistory(legacyId);
  }

  @Post(':legacyId/import')
  @RequirePermission(Permissions.PATIENT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async importFromLegacy(@Param('legacyId') legacyId: string): Promise<PatientResponseDto> {
    return this.patientSyncService.importFromLegacy(legacyId);
  }
}
