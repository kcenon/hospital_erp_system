import { Controller, Get, Post, Patch, Body, Param, Query, Headers } from '@nestjs/common';
import { RoundingService } from './rounding.service';
import { TabletRoundingService } from './tablet-rounding.service';
import { ParseUUIDPipe } from '../../common';
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

@Controller('rounds')
export class RoundController {
  constructor(
    private readonly roundingService: RoundingService,
    private readonly tabletRoundingService: TabletRoundingService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateRoundDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<RoundResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.roundingService.createSession(dto, effectiveUserId);
  }

  @Get()
  async findAll(@Query() dto: FindRoundsDto): Promise<PaginatedRoundsResponseDto> {
    return this.roundingService.findAll(dto);
  }

  @Get('by-number/:roundNumber')
  async findByRoundNumber(@Param('roundNumber') roundNumber: string): Promise<RoundResponseDto> {
    return this.roundingService.findByRoundNumber(roundNumber);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<RoundResponseDto> {
    return this.roundingService.findById(id);
  }

  @Post(':id/start')
  async start(@Param('id', ParseUUIDPipe) id: string): Promise<RoundResponseDto> {
    return this.roundingService.startSession(id);
  }

  @Post(':id/pause')
  async pause(@Param('id', ParseUUIDPipe) id: string): Promise<RoundResponseDto> {
    return this.roundingService.pauseSession(id);
  }

  @Post(':id/resume')
  async resume(@Param('id', ParseUUIDPipe) id: string): Promise<RoundResponseDto> {
    return this.roundingService.resumeSession(id);
  }

  @Post(':id/complete')
  async complete(@Param('id', ParseUUIDPipe) id: string): Promise<RoundResponseDto> {
    return this.roundingService.completeSession(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id', ParseUUIDPipe) id: string): Promise<RoundResponseDto> {
    return this.roundingService.cancelSession(id);
  }

  @Get(':id/patients')
  async getPatientList(@Param('id', ParseUUIDPipe) id: string): Promise<RoundingPatientListDto> {
    return this.tabletRoundingService.getRoundingPatientList(id);
  }

  @Get(':id/records')
  async getRecords(@Param('id', ParseUUIDPipe) id: string): Promise<RoundRecordResponseDto[]> {
    return this.roundingService.getRecordsByRound(id);
  }

  @Post(':id/records')
  async addRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRoundRecordDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<RoundRecordResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.tabletRoundingService.addRoundRecord(id, dto, effectiveUserId);
  }

  @Patch(':id/records/:recordId')
  async updateRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Body() dto: UpdateRoundRecordDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<RoundRecordResponseDto> {
    const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
    return this.roundingService.updateRecord(id, recordId, dto, effectiveUserId);
  }
}
