import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoundingService } from './rounding.service';
import { TabletRoundingService } from './tablet-rounding.service';
import { ParseUUIDPipe, CurrentUser } from '../../common';
import { JwtAuthGuard } from '../../common/guards';
import { PermissionGuard } from '../auth/guards';
import { RequirePermission } from '../auth/decorators';
import { Permissions } from '../auth/constants';
import {
  CreateRoundDto,
  CreateRoundRecordDto,
  UpdateRoundRecordDto,
  FindRoundsDto,
  RoundResponseDto,
  RoundRecordResponseDto,
  PaginatedRoundsResponseDto,
  RoundingPatientListDto,
} from './dto';

@ApiTags('rounds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('rounds')
export class RoundController {
  constructor(
    private readonly roundingService: RoundingService,
    private readonly tabletRoundingService: TabletRoundingService,
  ) {}

  @RequirePermission(Permissions.ROUND_WRITE)
  @ApiOperation({ summary: 'Create a new rounding session' })
  @ApiResponse({ status: 201, description: 'Round created successfully', type: RoundResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  async create(
    @Body() dto: CreateRoundDto,
    @CurrentUser() user: { id: string },
  ): Promise<RoundResponseDto> {
    return this.roundingService.createSession(dto, user.id);
  }

  @RequirePermission(Permissions.ROUND_READ)
  @ApiOperation({ summary: 'Get all rounding sessions with filters' })
  @ApiResponse({ status: 200, description: 'List of rounds', type: PaginatedRoundsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  async findAll(@Query() dto: FindRoundsDto): Promise<PaginatedRoundsResponseDto> {
    return this.roundingService.findAll(dto);
  }

  @ApiOperation({ summary: 'Get round by round number' })
  @ApiParam({ name: 'roundNumber', description: 'Round number (e.g., RND-20240101-001)' })
  @ApiResponse({ status: 200, description: 'Round details', type: RoundResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  @RequirePermission(Permissions.ROUND_READ)
  @Get('by-number/:roundNumber')
  async findByRoundNumber(@Param('roundNumber') roundNumber: string): Promise<RoundResponseDto> {
    return this.roundingService.findByRoundNumber(roundNumber);
  }

  @ApiOperation({ summary: 'Get round by ID' })
  @ApiParam({ name: 'id', description: 'Round UUID' })
  @ApiResponse({ status: 200, description: 'Round details', type: RoundResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  @RequirePermission(Permissions.ROUND_READ)
  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<RoundResponseDto> {
    return this.roundingService.findById(id);
  }

  @ApiOperation({ summary: 'Start a rounding session' })
  @ApiParam({ name: 'id', description: 'Round UUID' })
  @ApiResponse({ status: 200, description: 'Round started', type: RoundResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  @RequirePermission(Permissions.ROUND_WRITE)
  @Post(':id/start')
  async start(@Param('id', ParseUUIDPipe) id: string): Promise<RoundResponseDto> {
    return this.roundingService.startSession(id);
  }

  @ApiOperation({ summary: 'Pause a rounding session' })
  @ApiParam({ name: 'id', description: 'Round UUID' })
  @ApiResponse({ status: 200, description: 'Round paused', type: RoundResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  @RequirePermission(Permissions.ROUND_WRITE)
  @Post(':id/pause')
  async pause(@Param('id', ParseUUIDPipe) id: string): Promise<RoundResponseDto> {
    return this.roundingService.pauseSession(id);
  }

  @ApiOperation({ summary: 'Resume a paused rounding session' })
  @ApiParam({ name: 'id', description: 'Round UUID' })
  @ApiResponse({ status: 200, description: 'Round resumed', type: RoundResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  @RequirePermission(Permissions.ROUND_WRITE)
  @Post(':id/resume')
  async resume(@Param('id', ParseUUIDPipe) id: string): Promise<RoundResponseDto> {
    return this.roundingService.resumeSession(id);
  }

  @ApiOperation({ summary: 'Complete a rounding session' })
  @ApiParam({ name: 'id', description: 'Round UUID' })
  @ApiResponse({ status: 200, description: 'Round completed', type: RoundResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  @RequirePermission(Permissions.ROUND_WRITE)
  @Post(':id/complete')
  async complete(@Param('id', ParseUUIDPipe) id: string): Promise<RoundResponseDto> {
    return this.roundingService.completeSession(id);
  }

  @ApiOperation({ summary: 'Cancel a rounding session' })
  @ApiParam({ name: 'id', description: 'Round UUID' })
  @ApiResponse({ status: 200, description: 'Round cancelled', type: RoundResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  @RequirePermission(Permissions.ROUND_WRITE)
  @Post(':id/cancel')
  async cancel(@Param('id', ParseUUIDPipe) id: string): Promise<RoundResponseDto> {
    return this.roundingService.cancelSession(id);
  }

  @ApiOperation({ summary: 'Get patient list for a rounding session' })
  @ApiParam({ name: 'id', description: 'Round UUID' })
  @ApiResponse({
    status: 200,
    description: 'Patient list for rounding',
    type: RoundingPatientListDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  @RequirePermission(Permissions.ROUND_READ)
  @Get(':id/patients')
  async getPatientList(@Param('id', ParseUUIDPipe) id: string): Promise<RoundingPatientListDto> {
    return this.tabletRoundingService.getRoundingPatientList(id);
  }

  @ApiOperation({ summary: 'Get all records for a rounding session' })
  @ApiParam({ name: 'id', description: 'Round UUID' })
  @ApiResponse({
    status: 200,
    description: 'List of round records',
    type: [RoundRecordResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  @RequirePermission(Permissions.ROUND_READ)
  @Get(':id/records')
  async getRecords(@Param('id', ParseUUIDPipe) id: string): Promise<RoundRecordResponseDto[]> {
    return this.roundingService.getRecordsByRound(id);
  }

  @RequirePermission(Permissions.ROUND_WRITE)
  @ApiOperation({ summary: 'Add a record to a rounding session' })
  @ApiParam({ name: 'id', description: 'Round UUID' })
  @ApiResponse({
    status: 201,
    description: 'Record added successfully',
    type: RoundRecordResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  @Post(':id/records')
  async addRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRoundRecordDto,
    @CurrentUser() user: { id: string },
  ): Promise<RoundRecordResponseDto> {
    return this.tabletRoundingService.addRoundRecord(id, dto, user.id);
  }

  @RequirePermission(Permissions.ROUND_WRITE)
  @ApiOperation({ summary: 'Update a round record' })
  @ApiParam({ name: 'id', description: 'Round UUID' })
  @ApiParam({ name: 'recordId', description: 'Record UUID' })
  @ApiResponse({
    status: 200,
    description: 'Record updated successfully',
    type: RoundRecordResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Round or record not found' })
  @Patch(':id/records/:recordId')
  async updateRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Body() dto: UpdateRoundRecordDto,
    @CurrentUser() user: { id: string },
  ): Promise<RoundRecordResponseDto> {
    return this.roundingService.updateRecord(id, recordId, dto, user.id);
  }
}
