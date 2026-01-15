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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
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

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @ApiOperation({ summary: 'Create new patient' })
  @ApiResponse({ status: 201, description: 'Patient created', type: PatientResponseDto })
  @ApiResponse({ status: 403, description: 'Permission denied' })
  @Post()
  @RequirePermission(Permissions.PATIENT_CREATE)
  async create(
    @Body() dto: CreatePatientDto,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<PatientResponseDto> {
    return this.patientService.create(dto);
  }

  @ApiOperation({ summary: 'Get patient list' })
  @ApiResponse({
    status: 200,
    description: 'Paginated patient list',
    type: PaginatedPatientsResponseDto,
  })
  @Get()
  @RequirePermission(Permissions.PATIENT_READ)
  async findAll(
    @Query() dto: FindPatientsDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaginatedPatientsResponseDto> {
    return this.patientService.findAll(dto, user.role);
  }

  @ApiOperation({ summary: 'Search patients by name or number' })
  @ApiQuery({ name: 'q', description: 'Search query', required: false })
  @ApiResponse({ status: 200, description: 'Search results', type: [PatientResponseDto] })
  @Get('search')
  @RequirePermission(Permissions.PATIENT_READ)
  async search(
    @Query('q') query: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PatientResponseDto[]> {
    return this.patientService.search(query || '', user.role);
  }

  @ApiOperation({ summary: 'Find patient by patient number' })
  @ApiParam({ name: 'patientNumber', description: 'Patient number' })
  @ApiResponse({ status: 200, description: 'Patient found', type: PatientResponseDto })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @Get('by-number/:patientNumber')
  @RequirePermission(Permissions.PATIENT_READ)
  async findByPatientNumber(
    @Param('patientNumber') patientNumber: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PatientResponseDto> {
    return this.patientService.findByPatientNumber(patientNumber, user.role);
  }

  @ApiOperation({ summary: 'Find patient by legacy ID' })
  @ApiParam({ name: 'legacyId', description: 'Legacy patient ID' })
  @ApiResponse({ status: 200, description: 'Patient found', type: PatientResponseDto })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @Get('by-legacy-id/:legacyId')
  @RequirePermission(Permissions.PATIENT_READ)
  async findByLegacyId(
    @Param('legacyId') legacyId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PatientResponseDto> {
    return this.patientService.findByLegacyId(legacyId, user.role);
  }

  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Patient found', type: PatientResponseDto })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @Get(':id')
  @RequirePermission(Permissions.PATIENT_READ)
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PatientResponseDto> {
    return this.patientService.findById(id, user.role);
  }

  @ApiOperation({ summary: 'Update patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Patient updated', type: PatientResponseDto })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @Patch(':id')
  @RequirePermission(Permissions.PATIENT_UPDATE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<PatientResponseDto> {
    return this.patientService.update(id, dto);
  }

  @ApiOperation({ summary: 'Soft delete patient (Admin only)' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 204, description: 'Patient deleted' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @Delete(':id')
  @RequireRole('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<void> {
    return this.patientService.softDelete(id);
  }

  @ApiOperation({ summary: 'Create patient detail' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 201, description: 'Detail created', type: PatientDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @Post(':id/detail')
  @RequirePermission(Permissions.PATIENT_UPDATE)
  async createDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePatientDetailDto,
    @CurrentUser() _user: AuthenticatedUser,
  ): Promise<PatientDetailResponseDto> {
    return this.patientService.createDetail(id, dto);
  }

  @ApiOperation({ summary: 'Update patient detail' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Detail updated', type: PatientDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Patient or detail not found' })
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
