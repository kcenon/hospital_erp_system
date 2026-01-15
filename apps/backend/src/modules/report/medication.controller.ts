import { Controller, Get, Post, Body, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { MedicationService } from './medication.service';
import { ParseUUIDPipe, JwtAuthGuard } from '../../common';
import { PermissionGuard, RequirePermission } from '../auth';
import {
  ScheduleMedicationDto,
  AdministerMedicationDto,
  HoldMedicationDto,
  RefuseMedicationDto,
  GetMedicationHistoryDto,
  MedicationResponseDto,
  PaginatedMedicationResponseDto,
} from './dto/medication.dto';

/**
 * Medication Controller
 *
 * Handles HTTP endpoints for medication management.
 * Reference: SDS Section 4.5 (Report Module)
 * Requirements: REQ-FR-036~038
 */
@Controller('admissions/:admissionId/medications')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  /**
   * Schedule medication
   * POST /admissions/:admissionId/medications
   */
  @Post()
  @RequirePermission('report:write')
  async schedule(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Body() dto: ScheduleMedicationDto,
  ): Promise<MedicationResponseDto> {
    return this.medicationService.schedule(admissionId, dto);
  }

  /**
   * Administer medication
   * POST /admissions/:admissionId/medications/:id/administer
   */
  @Post(':id/administer')
  @RequirePermission('report:write')
  async administer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdministerMedicationDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<MedicationResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.medicationService.administer(id, dto, effectiveUserId);
  }

  /**
   * Hold medication
   * POST /admissions/:admissionId/medications/:id/hold
   */
  @Post(':id/hold')
  @RequirePermission('report:write')
  async hold(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HoldMedicationDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<MedicationResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.medicationService.hold(id, dto, effectiveUserId);
  }

  /**
   * Refuse medication
   * POST /admissions/:admissionId/medications/:id/refuse
   */
  @Post(':id/refuse')
  @RequirePermission('report:write')
  async refuse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefuseMedicationDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<MedicationResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.medicationService.refuse(id, dto, effectiveUserId);
  }

  /**
   * Get scheduled medications for a date
   * GET /admissions/:admissionId/medications/scheduled/:date
   */
  @Get('scheduled/:date')
  @RequirePermission('report:read')
  async getScheduled(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Param('date') dateStr: string,
  ): Promise<MedicationResponseDto[]> {
    const date = new Date(dateStr);
    return this.medicationService.getScheduled(admissionId, date);
  }

  /**
   * Get medication history
   * GET /admissions/:admissionId/medications
   */
  @Get()
  @RequirePermission('report:read')
  async getHistory(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Query() query: GetMedicationHistoryDto,
  ): Promise<PaginatedMedicationResponseDto> {
    return this.medicationService.getHistory(admissionId, query);
  }
}
