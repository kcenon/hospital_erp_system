import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { ParseUUIDPipe, CurrentUser } from '../../common';
import { JwtAuthGuard } from '../../common/guards';
import { PermissionGuard } from '../auth/guards';
import { RequirePermission, RequireRole } from '../auth/decorators';
import { Permissions } from '../auth/constants';
import { UserRole } from './data-masking.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  CreatePatientDetailDto,
  UpdatePatientDetailDto,
  FindPatientsDto,
  PatientResponseDto,
  PatientDetailResponseDto,
  PaginatedPatientsResponseDto,
} from './dto';

interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

@Controller('patients')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @RequirePermission(Permissions.PATIENT_CREATE)
  async create(
    @Body() dto: CreatePatientDto,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<PatientResponseDto> {
    return this.patientService.create(dto);
  }

  @Get()
  @RequirePermission(Permissions.PATIENT_READ)
  async findAll(
    @Query() dto: FindPatientsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedPatientsResponseDto> {
    return this.patientService.findAll(dto, user.role);
  }

  @Get('search')
  @RequirePermission(Permissions.PATIENT_READ)
  async search(
    @Query('q') query: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PatientResponseDto[]> {
    return this.patientService.search(query || '', user.role);
  }

  @Get('by-number/:patientNumber')
  @RequirePermission(Permissions.PATIENT_READ)
  async findByPatientNumber(
    @Param('patientNumber') patientNumber: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PatientResponseDto> {
    return this.patientService.findByPatientNumber(patientNumber, user.role);
  }

  @Get('by-legacy-id/:legacyId')
  @RequirePermission(Permissions.PATIENT_READ)
  async findByLegacyId(
    @Param('legacyId') legacyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PatientResponseDto> {
    return this.patientService.findByLegacyId(legacyId, user.role);
  }

  @Get(':id')
  @RequirePermission(Permissions.PATIENT_READ)
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PatientResponseDto> {
    return this.patientService.findById(id, user.role);
  }

  @Patch(':id')
  @RequirePermission(Permissions.PATIENT_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<PatientResponseDto> {
    return this.patientService.update(id, dto);
  }

  @Delete(':id')
  @RequireRole('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<void> {
    return this.patientService.softDelete(id);
  }

  @Post(':id/detail')
  @RequirePermission(Permissions.PATIENT_UPDATE)
  async createDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePatientDetailDto,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<PatientDetailResponseDto> {
    return this.patientService.createDetail(id, dto);
  }

  @Patch(':id/detail')
  @RequirePermission(Permissions.PATIENT_UPDATE)
  async updateDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDetailDto,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<PatientDetailResponseDto> {
    return this.patientService.updateDetail(id, dto);
  }
}
