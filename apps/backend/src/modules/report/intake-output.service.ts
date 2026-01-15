import { Injectable, Logger } from '@nestjs/common';
import { AdmissionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma';
import { IntakeOutputRepository } from './intake-output.repository';
import { RecordIODto } from './dto/record-io.dto';
import {
  IntakeOutputResponseDto,
  IODailySummaryDto,
  IOBalanceDto,
  PaginatedIOResponseDto,
} from './dto/io-response.dto';
import { GetIOHistoryDto, GetIOBalanceDto } from './dto/get-io-history.dto';
import { AdmissionNotFoundException, AdmissionNotActiveException } from './exceptions';

// Balance threshold for alert status (configurable)
const BALANCE_THRESHOLD = 500; // ml

/**
 * IntakeOutputService implementation
 *
 * Handles intake/output recording and daily summaries.
 * Reference: SDS Section 4.5 (Report Module)
 * Requirements: REQ-FR-036~038
 */
@Injectable()
export class IntakeOutputService {
  private readonly logger = new Logger(IntakeOutputService.name);

  constructor(
    private readonly ioRepo: IntakeOutputRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Record intake/output (REQ-FR-036)
   */
  async record(
    admissionId: string,
    dto: RecordIODto,
    userId: string,
  ): Promise<IntakeOutputResponseDto> {
    // 1. Validate admission is active
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    if (admission.status !== AdmissionStatus.ACTIVE) {
      throw new AdmissionNotActiveException(admissionId);
    }

    // 2. Parse dates
    const recordDate = new Date(dto.recordDate);
    const recordTime = new Date(dto.recordTime);

    // 3. Create record
    const ioRecord = await this.ioRepo.create({
      admissionId,
      recordDate,
      recordTime,
      oralIntake: dto.oralIntake ?? 0,
      ivIntake: dto.ivIntake ?? 0,
      tubeFeeding: dto.tubeFeeding ?? 0,
      otherIntake: dto.otherIntake ?? 0,
      urineOutput: dto.urineOutput ?? 0,
      stoolOutput: dto.stoolOutput ?? 0,
      vomitOutput: dto.vomitOutput ?? 0,
      drainageOutput: dto.drainageOutput ?? 0,
      otherOutput: dto.otherOutput ?? 0,
      recordedBy: userId,
      notes: dto.notes,
    });

    this.logger.log(`I/O recorded for admission ${admissionId} by user ${userId}`);

    return this.toResponseDto(ioRecord);
  }

  /**
   * Get I/O history for an admission
   */
  async getHistory(admissionId: string, dto: GetIOHistoryDto): Promise<PaginatedIOResponseDto> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const result = await this.ioRepo.findByAdmission({
      admissionId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      page: dto.page,
      limit: dto.limit,
    });

    return {
      data: result.data.map((io) => this.toResponseDto(io)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Get daily I/O summary (REQ-FR-037)
   */
  async getDailySummary(admissionId: string, date: Date): Promise<IODailySummaryDto | null> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const aggregate = await this.ioRepo.getDailySummary(admissionId, date);

    if (!aggregate) {
      return null;
    }

    const totalIntake =
      aggregate.oralIntake + aggregate.ivIntake + aggregate.tubeFeeding + aggregate.otherIntake;
    const totalOutput =
      aggregate.urineOutput +
      aggregate.stoolOutput +
      aggregate.vomitOutput +
      aggregate.drainageOutput +
      aggregate.otherOutput;
    const balance = totalIntake - totalOutput;

    return {
      date,
      intake: {
        oral: aggregate.oralIntake,
        iv: aggregate.ivIntake,
        tubeFeeding: aggregate.tubeFeeding,
        other: aggregate.otherIntake,
        total: totalIntake,
      },
      output: {
        urine: aggregate.urineOutput,
        stool: aggregate.stoolOutput,
        vomit: aggregate.vomitOutput,
        drainage: aggregate.drainageOutput,
        other: aggregate.otherOutput,
        total: totalOutput,
      },
      balance,
      status: this.getBalanceStatus(balance),
    };
  }

  /**
   * Get I/O balance history for date range (REQ-FR-038)
   */
  async getBalanceHistory(admissionId: string, dto: GetIOBalanceDto): Promise<IOBalanceDto[]> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const aggregates = await this.ioRepo.getDailyAggregates(admissionId, startDate, endDate);

    return aggregates.map((agg) => {
      const totalIntake = agg.oralIntake + agg.ivIntake + agg.tubeFeeding + agg.otherIntake;
      const totalOutput =
        agg.urineOutput + agg.stoolOutput + agg.vomitOutput + agg.drainageOutput + agg.otherOutput;
      const balance = totalIntake - totalOutput;

      return {
        date: agg.recordDate,
        totalIntake,
        totalOutput,
        balance,
        status: this.getBalanceStatus(balance),
      };
    });
  }

  /**
   * Determine balance status based on threshold
   */
  private getBalanceStatus(balance: number): 'NORMAL' | 'POSITIVE' | 'NEGATIVE' {
    if (balance > BALANCE_THRESHOLD) {
      return 'POSITIVE';
    } else if (balance < -BALANCE_THRESHOLD) {
      return 'NEGATIVE';
    }
    return 'NORMAL';
  }

  /**
   * Convert IntakeOutput entity to response DTO
   */
  private toResponseDto(io: {
    id: string;
    admissionId: string;
    recordDate: Date;
    recordTime: Date;
    oralIntake: number;
    ivIntake: number;
    tubeFeeding: number;
    otherIntake: number;
    urineOutput: number;
    stoolOutput: number;
    vomitOutput: number;
    drainageOutput: number;
    otherOutput: number;
    recordedBy: string;
    notes: string | null;
    createdAt: Date;
  }): IntakeOutputResponseDto {
    const totalIntake = io.oralIntake + io.ivIntake + io.tubeFeeding + io.otherIntake;
    const totalOutput =
      io.urineOutput + io.stoolOutput + io.vomitOutput + io.drainageOutput + io.otherOutput;
    const balance = totalIntake - totalOutput;

    return {
      id: io.id,
      admissionId: io.admissionId,
      recordDate: io.recordDate,
      recordTime: io.recordTime,
      oralIntake: io.oralIntake,
      ivIntake: io.ivIntake,
      tubeFeeding: io.tubeFeeding,
      otherIntake: io.otherIntake,
      totalIntake,
      urineOutput: io.urineOutput,
      stoolOutput: io.stoolOutput,
      vomitOutput: io.vomitOutput,
      drainageOutput: io.drainageOutput,
      otherOutput: io.otherOutput,
      totalOutput,
      balance,
      recordedBy: io.recordedBy,
      notes: io.notes,
      createdAt: io.createdAt,
    };
  }
}
