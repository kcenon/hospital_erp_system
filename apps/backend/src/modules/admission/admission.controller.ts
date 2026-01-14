import { Controller, Get, Post, Body, Param, Query, Headers } from '@nestjs/common';
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

@Controller('admissions')
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}

  @Post()
  async create(
    @Body() dto: CreateAdmissionDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<AdmissionResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.admissionService.admitPatient(dto, effectiveUserId);
  }

  @Get()
  async findAll(@Query() dto: FindAdmissionsDto): Promise<PaginatedAdmissionsResponseDto> {
    return this.admissionService.findAll(dto);
  }

  @Get('by-number/:admissionNumber')
  async findByAdmissionNumber(
    @Param('admissionNumber') admissionNumber: string,
  ): Promise<AdmissionResponseDto> {
    return this.admissionService.findByAdmissionNumber(admissionNumber);
  }

  @Get('patient/:patientId/active')
  async findActiveByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<AdmissionResponseDto | null> {
    return this.admissionService.findActiveByPatient(patientId);
  }

  @Get('floor/:floorId')
  async findByFloor(
    @Param('floorId', ParseUUIDPipe) floorId: string,
    @Query('status') status?: AdmissionStatus,
  ): Promise<AdmissionResponseDto[]> {
    return this.admissionService.findByFloor(floorId, status);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<AdmissionResponseDto> {
    return this.admissionService.findById(id);
  }

  @Post(':id/transfer')
  async transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<TransferResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.admissionService.transferPatient(id, dto, effectiveUserId);
  }

  @Post(':id/discharge')
  async discharge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DischargeDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<DischargeResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.admissionService.dischargePatient(id, dto, effectiveUserId);
  }

  @Get(':id/transfers')
  async getTransferHistory(@Param('id', ParseUUIDPipe) id: string): Promise<TransferResponseDto[]> {
    return this.admissionService.getTransferHistory(id);
  }
}
