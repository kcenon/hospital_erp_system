import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { ParseUUIDPipe } from '../../common';
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

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  async create(@Body() dto: CreatePatientDto): Promise<PatientResponseDto> {
    return this.patientService.create(dto);
  }

  @Get()
  async findAll(@Query() dto: FindPatientsDto): Promise<PaginatedPatientsResponseDto> {
    return this.patientService.findAll(dto);
  }

  @Get('search')
  async search(@Query('q') query: string): Promise<PatientResponseDto[]> {
    return this.patientService.search(query || '');
  }

  @Get('by-number/:patientNumber')
  async findByPatientNumber(
    @Param('patientNumber') patientNumber: string,
  ): Promise<PatientResponseDto> {
    return this.patientService.findByPatientNumber(patientNumber);
  }

  @Get('by-legacy-id/:legacyId')
  async findByLegacyId(@Param('legacyId') legacyId: string): Promise<PatientResponseDto> {
    return this.patientService.findByLegacyId(legacyId);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<PatientResponseDto> {
    return this.patientService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.patientService.softDelete(id);
  }

  @Post(':id/detail')
  async createDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePatientDetailDto,
  ): Promise<PatientDetailResponseDto> {
    return this.patientService.createDetail(id, dto);
  }

  @Put(':id/detail')
  async updateDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDetailDto,
  ): Promise<PatientDetailResponseDto> {
    return this.patientService.updateDetail(id, dto);
  }
}
