import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { MedicationService } from './medication.service';
import { ParseUUIDPipe, JwtAuthGuard, CurrentUser } from '../../common';
import { PermissionGuard, RequirePermission } from '../auth';
import {
  ScheduleMedicationDto,
  AdministerMedicationDto,
  HoldMedicationDto,
  RefuseMedicationDto,
  CancelMedicationDto,
  DiscontinueMedicationDto,
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
@ApiTags('medications')
@ApiBearerAuth()
@Controller('admissions/:admissionId/medications')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  /**
   * Schedule medication
   * POST /admissions/:admissionId/medications
   */
  @ApiOperation({ summary: 'Schedule a medication for an admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiResponse({
    status: 201,
    description: 'Medication scheduled successfully',
    type: MedicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
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
  @ApiOperation({ summary: 'Administer a scheduled medication' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiParam({ name: 'id', description: 'Medication UUID' })
  @ApiResponse({
    status: 200,
    description: 'Medication administered successfully',
    type: MedicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Medication not found' })
  @Post(':id/administer')
  @RequirePermission('report:write')
  async administer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdministerMedicationDto,
    @CurrentUser() user: { id: string },
  ): Promise<MedicationResponseDto> {
    return this.medicationService.administer(id, dto, user.id);
  }

  /**
   * Hold medication
   * POST /admissions/:admissionId/medications/:id/hold
   */
  @ApiOperation({ summary: 'Hold a scheduled medication' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiParam({ name: 'id', description: 'Medication UUID' })
  @ApiResponse({
    status: 200,
    description: 'Medication held successfully',
    type: MedicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Medication not found' })
  @Post(':id/hold')
  @RequirePermission('report:write')
  async hold(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HoldMedicationDto,
    @CurrentUser() user: { id: string },
  ): Promise<MedicationResponseDto> {
    return this.medicationService.hold(id, dto, user.id);
  }

  /**
   * Refuse medication
   * POST /admissions/:admissionId/medications/:id/refuse
   */
  @ApiOperation({ summary: 'Record patient refusal of medication' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiParam({ name: 'id', description: 'Medication UUID' })
  @ApiResponse({
    status: 200,
    description: 'Medication refusal recorded',
    type: MedicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Medication not found' })
  @Post(':id/refuse')
  @RequirePermission('report:write')
  async refuse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefuseMedicationDto,
    @CurrentUser() user: { id: string },
  ): Promise<MedicationResponseDto> {
    return this.medicationService.refuse(id, dto, user.id);
  }

  /**
   * Cancel medication
   * POST /admissions/:admissionId/medications/:id/cancel
   */
  @ApiOperation({ summary: 'Cancel a scheduled medication' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiParam({ name: 'id', description: 'Medication UUID' })
  @ApiResponse({
    status: 200,
    description: 'Medication cancelled successfully',
    type: MedicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid medication status for cancellation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Medication not found' })
  @Post(':id/cancel')
  @RequirePermission('report:write')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelMedicationDto,
    @CurrentUser() user: { id: string },
  ): Promise<MedicationResponseDto> {
    return this.medicationService.cancel(id, dto, user.id);
  }

  /**
   * Discontinue medication
   * POST /admissions/:admissionId/medications/:id/discontinue
   */
  @ApiOperation({ summary: 'Discontinue a medication' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiParam({ name: 'id', description: 'Medication UUID' })
  @ApiResponse({
    status: 200,
    description: 'Medication discontinued successfully',
    type: MedicationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid medication status for discontinuation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Medication not found' })
  @Post(':id/discontinue')
  @RequirePermission('report:write')
  async discontinue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DiscontinueMedicationDto,
    @CurrentUser() user: { id: string },
  ): Promise<MedicationResponseDto> {
    return this.medicationService.discontinue(id, dto, user.id);
  }

  /**
   * Get scheduled medications for a date
   * GET /admissions/:admissionId/medications/scheduled/:date
   */
  @ApiOperation({ summary: 'Get scheduled medications for a specific date' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiParam({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled medications retrieved',
    type: [MedicationResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
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
  @ApiOperation({ summary: 'Get medication history for an admission' })
  @ApiParam({ name: 'admissionId', description: 'Admission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Medication history retrieved',
    type: PaginatedMedicationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Admission not found' })
  @Get()
  @RequirePermission('report:read')
  async getHistory(
    @Param('admissionId', ParseUUIDPipe) admissionId: string,
    @Query() query: GetMedicationHistoryDto,
  ): Promise<PaginatedMedicationResponseDto> {
    return this.medicationService.getHistory(admissionId, query);
  }
}
