import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { RoundStatus } from '@prisma/client';
import { RoundingRepository, RoundWithRecords } from './rounding.repository';
import { RoundingStateMachine } from './rounding-state-machine';
import {
  CreateRoundDto,
  CreateRoundRecordDto,
  UpdateRoundRecordDto,
  FindRoundsDto,
  RoundResponseDto,
  RoundRecordResponseDto,
  PaginatedRoundsResponseDto,
} from './dto';
import {
  RoundNotFoundException,
  RoundNotInProgressException,
  FloorNotFoundException,
  RoundRecordNotFoundException,
  RoundRecordAlreadyExistsException,
} from './exceptions';

@Injectable()
export class RoundingService {
  constructor(
    private readonly repository: RoundingRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createSession(dto: CreateRoundDto, userId: string): Promise<RoundResponseDto> {
    const floor = await this.prisma.floor.findUnique({
      where: { id: dto.floorId },
    });

    if (!floor) {
      throw new FloorNotFoundException(dto.floorId);
    }

    const scheduledDate = new Date(dto.scheduledDate);
    const roundNumber = await this.repository.getNextRoundNumber(scheduledDate);

    let scheduledTime: Date | undefined;
    if (dto.scheduledTime) {
      scheduledTime = this.parseTimeToDate(dto.scheduledTime);
    }

    const round = await this.repository.create({
      roundNumber,
      floorId: dto.floorId,
      roundType: dto.roundType,
      scheduledDate,
      scheduledTime,
      leadDoctorId: dto.leadDoctorId,
      notes: dto.notes,
      createdBy: userId,
    });

    const roundWithRecords = await this.repository.findById(round.id);
    return this.toResponseDto(roundWithRecords!);
  }

  async startSession(roundId: string): Promise<RoundResponseDto> {
    const round = await this.repository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundException(roundId);
    }

    RoundingStateMachine.validateTransition(round.status, RoundStatus.IN_PROGRESS);

    await this.repository.update(roundId, {
      status: RoundStatus.IN_PROGRESS,
      startedAt: new Date(),
      pausedAt: null,
    });

    const updatedRound = await this.repository.findById(roundId);
    return this.toResponseDto(updatedRound!);
  }

  async pauseSession(roundId: string): Promise<RoundResponseDto> {
    const round = await this.repository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundException(roundId);
    }

    RoundingStateMachine.validateTransition(round.status, RoundStatus.PAUSED);

    await this.repository.update(roundId, {
      status: RoundStatus.PAUSED,
      pausedAt: new Date(),
    });

    const updatedRound = await this.repository.findById(roundId);
    return this.toResponseDto(updatedRound!);
  }

  async resumeSession(roundId: string): Promise<RoundResponseDto> {
    const round = await this.repository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundException(roundId);
    }

    RoundingStateMachine.validateTransition(round.status, RoundStatus.IN_PROGRESS);

    await this.repository.update(roundId, {
      status: RoundStatus.IN_PROGRESS,
      pausedAt: null,
    });

    const updatedRound = await this.repository.findById(roundId);
    return this.toResponseDto(updatedRound!);
  }

  async completeSession(roundId: string): Promise<RoundResponseDto> {
    const round = await this.repository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundException(roundId);
    }

    RoundingStateMachine.validateTransition(round.status, RoundStatus.COMPLETED);

    await this.repository.update(roundId, {
      status: RoundStatus.COMPLETED,
      completedAt: new Date(),
      pausedAt: null,
    });

    const updatedRound = await this.repository.findById(roundId);
    return this.toResponseDto(updatedRound!);
  }

  async cancelSession(roundId: string): Promise<RoundResponseDto> {
    const round = await this.repository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundException(roundId);
    }

    RoundingStateMachine.validateTransition(round.status, RoundStatus.CANCELLED);

    await this.repository.update(roundId, {
      status: RoundStatus.CANCELLED,
      pausedAt: null,
    });

    const updatedRound = await this.repository.findById(roundId);
    return this.toResponseDto(updatedRound!);
  }

  async findById(id: string): Promise<RoundResponseDto> {
    const round = await this.repository.findById(id);
    if (!round) {
      throw new RoundNotFoundException(id);
    }
    return this.toResponseDto(round);
  }

  async findByRoundNumber(roundNumber: string): Promise<RoundResponseDto> {
    const round = await this.repository.findByRoundNumber(roundNumber);
    if (!round) {
      throw new RoundNotFoundException(roundNumber);
    }
    return this.toResponseDto(round);
  }

  async findAll(dto: FindRoundsDto): Promise<PaginatedRoundsResponseDto> {
    const result = await this.repository.findAll({
      floorId: dto.floorId,
      leadDoctorId: dto.leadDoctorId,
      status: dto.status,
      roundType: dto.roundType,
      scheduledDateFrom: dto.scheduledDateFrom ? new Date(dto.scheduledDateFrom) : undefined,
      scheduledDateTo: dto.scheduledDateTo ? new Date(dto.scheduledDateTo) : undefined,
      page: dto.page,
      limit: dto.limit,
    });

    return {
      data: result.data.map((round) => this.toResponseDto(round)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async addRecord(
    roundId: string,
    dto: CreateRoundRecordDto,
    userId: string,
  ): Promise<RoundRecordResponseDto> {
    const round = await this.repository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundException(roundId);
    }

    if (round.status !== RoundStatus.IN_PROGRESS) {
      throw new RoundNotInProgressException(roundId);
    }

    const existingRecord = await this.repository.findRecordByRoundAndAdmission(
      roundId,
      dto.admissionId,
    );

    if (existingRecord) {
      throw new RoundRecordAlreadyExistsException(roundId, dto.admissionId);
    }

    const visitOrder = await this.repository.getNextVisitOrder(roundId);

    const record = await this.repository.createRecord({
      roundId,
      admissionId: dto.admissionId,
      visitOrder,
      patientStatus: dto.patientStatus,
      chiefComplaint: dto.chiefComplaint,
      observation: dto.observation,
      assessment: dto.assessment,
      plan: dto.plan,
      orders: dto.orders,
      visitedAt: new Date(),
      recordedBy: userId,
    });

    return this.toRecordResponseDto(record);
  }

  async updateRecord(
    roundId: string,
    recordId: string,
    dto: UpdateRoundRecordDto,
    _userId: string,
  ): Promise<RoundRecordResponseDto> {
    const round = await this.repository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundException(roundId);
    }

    const record = await this.repository.findRecordById(recordId);
    if (!record || record.roundId !== roundId) {
      throw new RoundRecordNotFoundException(recordId);
    }

    const updatedRecord = await this.repository.updateRecord(recordId, {
      patientStatus: dto.patientStatus,
      chiefComplaint: dto.chiefComplaint,
      observation: dto.observation,
      assessment: dto.assessment,
      plan: dto.plan,
      orders: dto.orders,
      visitedAt: record.visitedAt ?? new Date(),
    });

    return this.toRecordResponseDto(updatedRecord);
  }

  async getRecordsByRound(roundId: string): Promise<RoundRecordResponseDto[]> {
    const round = await this.repository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundException(roundId);
    }

    const records = await this.repository.findRecordsByRound(roundId);
    return records.map((record) => this.toRecordResponseDto(record));
  }

  private parseTimeToDate(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private toResponseDto(round: RoundWithRecords): RoundResponseDto {
    return {
      id: round.id,
      roundNumber: round.roundNumber,
      floorId: round.floorId,
      roundType: round.roundType,
      scheduledDate: round.scheduledDate,
      scheduledTime: round.scheduledTime,
      startedAt: round.startedAt,
      completedAt: round.completedAt,
      pausedAt: round.pausedAt,
      status: round.status,
      leadDoctorId: round.leadDoctorId,
      notes: round.notes,
      createdAt: round.createdAt,
      updatedAt: round.updatedAt,
      createdBy: round.createdBy,
      records: round.records.map((record) => this.toRecordResponseDto(record)),
      validTransitions: RoundingStateMachine.getValidTransitions(round.status),
    };
  }

  private toRecordResponseDto(record: {
    id: string;
    roundId: string;
    admissionId: string;
    visitOrder: number;
    patientStatus: string | null;
    chiefComplaint: string | null;
    observation: string | null;
    assessment: string | null;
    plan: string | null;
    orders: string | null;
    visitedAt: Date | null;
    visitDuration: number | null;
    recordedBy: string;
    createdAt: Date;
    updatedAt: Date;
  }): RoundRecordResponseDto {
    return {
      id: record.id,
      roundId: record.roundId,
      admissionId: record.admissionId,
      visitOrder: record.visitOrder,
      patientStatus: record.patientStatus as RoundRecordResponseDto['patientStatus'],
      chiefComplaint: record.chiefComplaint,
      observation: record.observation,
      assessment: record.assessment,
      plan: record.plan,
      orders: record.orders,
      visitedAt: record.visitedAt,
      visitDuration: record.visitDuration,
      recordedBy: record.recordedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
