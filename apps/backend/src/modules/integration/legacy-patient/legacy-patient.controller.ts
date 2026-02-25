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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards';
import { PermissionGuard } from '../../auth/guards';
import { RequirePermission } from '../../auth/decorators';
import { Permissions } from '../../auth/constants';
import { PatientSyncService } from './services';
import { LegacyPatientResponseDto, MedicalHistoryResponseDto } from './dto';
import { PatientResponseDto } from '../../patient/dto';

@ApiTags('integration')
@ApiBearerAuth()
@Controller('patients/legacy')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class LegacyPatientController {
  constructor(private readonly patientSyncService: PatientSyncService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search patients in legacy system' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query string' })
  @ApiResponse({
    status: 200,
    description: 'Matching legacy patients',
    type: [LegacyPatientResponseDto],
  })
  @RequirePermission(Permissions.PATIENT_READ)
  async searchLegacy(@Query('q') query: string): Promise<LegacyPatientResponseDto[]> {
    return this.patientSyncService.searchLegacy(query || '');
  }

  @Get('health')
  @ApiOperation({ summary: 'Check legacy system connection status' })
  @ApiResponse({ status: 200, description: 'Connection status' })
  @RequirePermission(Permissions.PATIENT_READ)
  async checkConnection(): Promise<{ connected: boolean }> {
    const connected = await this.patientSyncService.checkConnection();
    return { connected };
  }

  @Get(':legacyId')
  @ApiOperation({ summary: 'Find patient by legacy system ID' })
  @ApiParam({ name: 'legacyId', description: 'Legacy system patient ID' })
  @ApiResponse({ status: 200, description: 'Legacy patient data', type: LegacyPatientResponseDto })
  @RequirePermission(Permissions.PATIENT_READ)
  async findByLegacyId(@Param('legacyId') legacyId: string): Promise<LegacyPatientResponseDto> {
    return this.patientSyncService.findLegacyById(legacyId);
  }

  @Get(':legacyId/medical-history')
  @ApiOperation({ summary: 'Get medical history from legacy system' })
  @ApiParam({ name: 'legacyId', description: 'Legacy system patient ID' })
  @ApiResponse({
    status: 200,
    description: 'Medical history data',
    type: MedicalHistoryResponseDto,
  })
  @RequirePermission(Permissions.PATIENT_READ)
  async getMedicalHistory(@Param('legacyId') legacyId: string): Promise<MedicalHistoryResponseDto> {
    return this.patientSyncService.getMedicalHistory(legacyId);
  }

  @Post(':legacyId/import')
  @ApiOperation({ summary: 'Import patient from legacy system' })
  @ApiParam({ name: 'legacyId', description: 'Legacy system patient ID to import' })
  @ApiResponse({
    status: 201,
    description: 'Patient imported successfully',
    type: PatientResponseDto,
  })
  @RequirePermission(Permissions.PATIENT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async importFromLegacy(@Param('legacyId') legacyId: string): Promise<PatientResponseDto> {
    return this.patientSyncService.importFromLegacy(legacyId);
  }
}
