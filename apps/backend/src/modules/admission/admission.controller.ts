import { Controller, Get, Post, Body, Param, Query, Headers } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdmissionService } from './admission.service';
import { ParseUUIDPipe } from '../../common';
import { AdmissionStatus } from '@prisma/client';
import {
  CreateAdmissionDto,
  TransferDto,
  DischargeDto,
  FindAdmissionsDto,
  AdmissionResponseDto,
  PaginatedAdmissionsResponseDto,
  TransferResponseDto,
  DischargeResponseDto,
} from './dto';

@ApiTags('admissions')
@ApiBearerAuth()
@Controller('admissions')
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}

  @ApiOperation({ summary: 'Create a new admission' })
  @ApiResponse({
    status: 201,
    description: 'Admission created successfully',
    type: AdmissionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Bed is already occupied or patient already admitted' })
  @Post()
  async create(
    @Body() dto: CreateAdmissionDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<AdmissionResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.admissionService.admitPatient(dto, effectiveUserId);
  }

  @ApiOperation({ summary: 'Get all admissions with pagination and filters' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of admissions',
    type: PaginatedAdmissionsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  async findAll(@Query() dto: FindAdmissionsDto): Promise<PaginatedAdmissionsResponseDto> {
    return this.admissionService.findAll(dto);
  }

  @ApiOperation({ summary: 'Find admission by admission number' })
  @ApiParam({ name: 'admissionNumber', description: 'Admission number', example: 'ADM2025000001' })
  @ApiResponse({ status: 200, description: 'Admission found', type: AdmissionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @Get('by-number/:admissionNumber')
  async findByAdmissionNumber(
    @Param('admissionNumber') admissionNumber: string,
  ): Promise<AdmissionResponseDto> {
    return this.admissionService.findByAdmissionNumber(admissionNumber);
  }

  @ApiOperation({ summary: 'Find active admission for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Active admission found or null',
    type: AdmissionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('patient/:patientId/active')
  async findActiveByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<AdmissionResponseDto | null> {
    return this.admissionService.findActiveByPatient(patientId);
  }

  @ApiOperation({ summary: 'Find all admissions by floor' })
  @ApiParam({ name: 'floorId', description: 'Floor ID', format: 'uuid' })
  @ApiQuery({
    name: 'status',
    description: 'Filter by admission status',
    required: false,
    enum: ['ADMITTED', 'DISCHARGED', 'TRANSFERRED'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of admissions on the floor',
    type: [AdmissionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('floor/:floorId')
  async findByFloor(
    @Param('floorId', ParseUUIDPipe) floorId: string,
    @Query('status') status?: AdmissionStatus,
  ): Promise<AdmissionResponseDto[]> {
    return this.admissionService.findByFloor(floorId, status);
  }

  @ApiOperation({ summary: 'Find admission by ID' })
  @ApiParam({ name: 'id', description: 'Admission ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Admission found', type: AdmissionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<AdmissionResponseDto> {
    return this.admissionService.findById(id);
  }

  @ApiOperation({ summary: 'Transfer patient to a different bed' })
  @ApiParam({ name: 'id', description: 'Admission ID', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Patient transferred successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @ApiResponse({ status: 409, description: 'Target bed is occupied' })
  @Post(':id/transfer')
  async transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<TransferResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.admissionService.transferPatient(id, dto, effectiveUserId);
  }

  @ApiOperation({ summary: 'Discharge patient' })
  @ApiParam({ name: 'id', description: 'Admission ID', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Patient discharged successfully',
    type: DischargeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @ApiResponse({ status: 409, description: 'Patient already discharged' })
  @Post(':id/discharge')
  async discharge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DischargeDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<DischargeResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.admissionService.dischargePatient(id, dto, effectiveUserId);
  }

  @ApiOperation({ summary: 'Get transfer history for an admission' })
  @ApiParam({ name: 'id', description: 'Admission ID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'List of transfers', type: [TransferResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @Get(':id/transfers')
  async getTransferHistory(@Param('id', ParseUUIDPipe) id: string): Promise<TransferResponseDto[]> {
    return this.admissionService.getTransferHistory(id);
  }
}
