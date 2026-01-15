import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { IntakeOutput, Prisma } from '@prisma/client';
import { PaginatedResult } from './interfaces';

export interface CreateIntakeOutputData {
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
  notes?: string;
}

export interface FindIOParams {
  admissionId: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface DailyIOAggregate {
  recordDate: Date;
  oralIntake: number;
  ivIntake: number;
  tubeFeeding: number;
  otherIntake: number;
  urineOutput: number;
  stoolOutput: number;
  vomitOutput: number;
  drainageOutput: number;
  otherOutput: number;
}

@Injectable()
export class IntakeOutputRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new intake/output record
   */
  async create(data: CreateIntakeOutputData): Promise<IntakeOutput> {
    return this.prisma.intakeOutput.create({
      data: {
        admissionId: data.admissionId,
        recordDate: data.recordDate,
        recordTime: data.recordTime,
        oralIntake: data.oralIntake,
        ivIntake: data.ivIntake,
        tubeFeeding: data.tubeFeeding,
        otherIntake: data.otherIntake,
        urineOutput: data.urineOutput,
        stoolOutput: data.stoolOutput,
        vomitOutput: data.vomitOutput,
        drainageOutput: data.drainageOutput,
        otherOutput: data.otherOutput,
        recordedBy: data.recordedBy,
        notes: data.notes ?? null,
      },
    });
  }

  /**
   * Find intake/output by ID
   */
  async findById(id: string): Promise<IntakeOutput | null> {
    return this.prisma.intakeOutput.findUnique({
      where: { id },
    });
  }

  /**
   * Find intake/output records by admission with pagination
   */
  async findByAdmission(params: FindIOParams): Promise<PaginatedResult<IntakeOutput>> {
    const { admissionId, startDate, endDate, page = 1, limit = 20 } = params;

    const where: Prisma.IntakeOutputWhereInput = {
      admissionId,
    };

    if (startDate || endDate) {
      where.recordDate = {};
      if (startDate) {
        where.recordDate.gte = startDate;
      }
      if (endDate) {
        where.recordDate.lte = endDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.intakeOutput.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ recordDate: 'desc' }, { recordTime: 'desc' }],
      }),
      this.prisma.intakeOutput.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find intake/output records for a specific date
   */
  async findByDate(admissionId: string, date: Date): Promise<IntakeOutput[]> {
    return this.prisma.intakeOutput.findMany({
      where: {
        admissionId,
        recordDate: date,
      },
      orderBy: { recordTime: 'asc' },
    });
  }

  /**
   * Get daily aggregates for a date range
   */
  async getDailyAggregates(
    admissionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DailyIOAggregate[]> {
    const records = await this.prisma.intakeOutput.groupBy({
      by: ['recordDate'],
      where: {
        admissionId,
        recordDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        oralIntake: true,
        ivIntake: true,
        tubeFeeding: true,
        otherIntake: true,
        urineOutput: true,
        stoolOutput: true,
        vomitOutput: true,
        drainageOutput: true,
        otherOutput: true,
      },
      orderBy: {
        recordDate: 'asc',
      },
    });

    return records.map((r) => ({
      recordDate: r.recordDate,
      oralIntake: r._sum.oralIntake ?? 0,
      ivIntake: r._sum.ivIntake ?? 0,
      tubeFeeding: r._sum.tubeFeeding ?? 0,
      otherIntake: r._sum.otherIntake ?? 0,
      urineOutput: r._sum.urineOutput ?? 0,
      stoolOutput: r._sum.stoolOutput ?? 0,
      vomitOutput: r._sum.vomitOutput ?? 0,
      drainageOutput: r._sum.drainageOutput ?? 0,
      otherOutput: r._sum.otherOutput ?? 0,
    }));
  }

  /**
   * Get daily summary for a specific date
   */
  async getDailySummary(admissionId: string, date: Date): Promise<DailyIOAggregate | null> {
    const result = await this.prisma.intakeOutput.aggregate({
      where: {
        admissionId,
        recordDate: date,
      },
      _sum: {
        oralIntake: true,
        ivIntake: true,
        tubeFeeding: true,
        otherIntake: true,
        urineOutput: true,
        stoolOutput: true,
        vomitOutput: true,
        drainageOutput: true,
        otherOutput: true,
      },
    });

    if (
      result._sum.oralIntake === null &&
      result._sum.ivIntake === null &&
      result._sum.tubeFeeding === null
    ) {
      return null;
    }

    return {
      recordDate: date,
      oralIntake: result._sum.oralIntake ?? 0,
      ivIntake: result._sum.ivIntake ?? 0,
      tubeFeeding: result._sum.tubeFeeding ?? 0,
      otherIntake: result._sum.otherIntake ?? 0,
      urineOutput: result._sum.urineOutput ?? 0,
      stoolOutput: result._sum.stoolOutput ?? 0,
      vomitOutput: result._sum.vomitOutput ?? 0,
      drainageOutput: result._sum.drainageOutput ?? 0,
      otherOutput: result._sum.otherOutput ?? 0,
    };
  }
}
