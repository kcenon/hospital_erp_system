import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import {
  Round,
  RoundRecord,
  RoundStatus,
  RoundType,
  RoundPatientStatus,
  Prisma,
} from '@prisma/client';

export interface CreateRoundData {
  roundNumber: string;
  floorId: string;
  roundType: RoundType;
  scheduledDate: Date;
  scheduledTime?: Date;
  leadDoctorId: string;
  notes?: string;
  createdBy: string;
}

export interface UpdateRoundData {
  status?: RoundStatus;
  startedAt?: Date;
  completedAt?: Date;
  pausedAt?: Date | null;
  notes?: string;
}

export interface CreateRoundRecordData {
  roundId: string;
  admissionId: string;
  visitOrder: number;
  patientStatus?: RoundPatientStatus;
  chiefComplaint?: string;
  observation?: string;
  assessment?: string;
  plan?: string;
  orders?: string;
  visitedAt?: Date;
  visitDuration?: number;
  recordedBy: string;
}

export interface UpdateRoundRecordData {
  patientStatus?: RoundPatientStatus;
  chiefComplaint?: string;
  observation?: string;
  assessment?: string;
  plan?: string;
  orders?: string;
  visitedAt?: Date;
  visitDuration?: number;
}

export interface FindRoundsParams {
  floorId?: string;
  leadDoctorId?: string;
  status?: RoundStatus;
  roundType?: RoundType;
  scheduledDateFrom?: Date;
  scheduledDateTo?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type RoundWithRecords = Round & {
  records: RoundRecord[];
};

@Injectable()
export class RoundingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRoundData): Promise<Round> {
    return this.prisma.round.create({
      data: {
        roundNumber: data.roundNumber,
        floorId: data.floorId,
        roundType: data.roundType,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        leadDoctorId: data.leadDoctorId,
        notes: data.notes,
        status: RoundStatus.PLANNED,
        createdBy: data.createdBy,
      },
    });
  }

  async findById(id: string): Promise<RoundWithRecords | null> {
    return this.prisma.round.findUnique({
      where: { id },
      include: {
        records: {
          orderBy: { visitOrder: 'asc' },
        },
      },
    });
  }

  async findByRoundNumber(roundNumber: string): Promise<RoundWithRecords | null> {
    return this.prisma.round.findUnique({
      where: { roundNumber },
      include: {
        records: {
          orderBy: { visitOrder: 'asc' },
        },
      },
    });
  }

  async findAll(params: FindRoundsParams): Promise<PaginatedResult<RoundWithRecords>> {
    const {
      floorId,
      leadDoctorId,
      status,
      roundType,
      scheduledDateFrom,
      scheduledDateTo,
      page = 1,
      limit = 20,
    } = params;

    const where: Prisma.RoundWhereInput = {};

    if (floorId) {
      where.floorId = floorId;
    }

    if (leadDoctorId) {
      where.leadDoctorId = leadDoctorId;
    }

    if (status) {
      where.status = status;
    }

    if (roundType) {
      where.roundType = roundType;
    }

    if (scheduledDateFrom || scheduledDateTo) {
      where.scheduledDate = {};
      if (scheduledDateFrom) {
        where.scheduledDate.gte = scheduledDateFrom;
      }
      if (scheduledDateTo) {
        where.scheduledDate.lte = scheduledDateTo;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.round.findMany({
        where,
        include: {
          records: {
            orderBy: { visitOrder: 'asc' },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ scheduledDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.round.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActiveByFloor(floorId: string): Promise<Round | null> {
    return this.prisma.round.findFirst({
      where: {
        floorId,
        status: RoundStatus.IN_PROGRESS,
      },
    });
  }

  async findByFloorAndDate(floorId: string, date: Date): Promise<RoundWithRecords[]> {
    return this.prisma.round.findMany({
      where: {
        floorId,
        scheduledDate: date,
      },
      include: {
        records: {
          orderBy: { visitOrder: 'asc' },
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });
  }

  async update(id: string, data: UpdateRoundData): Promise<Round> {
    return this.prisma.round.update({
      where: { id },
      data,
    });
  }

  async createRecord(data: CreateRoundRecordData): Promise<RoundRecord> {
    return this.prisma.roundRecord.create({
      data: {
        roundId: data.roundId,
        admissionId: data.admissionId,
        visitOrder: data.visitOrder,
        patientStatus: data.patientStatus,
        chiefComplaint: data.chiefComplaint,
        observation: data.observation,
        assessment: data.assessment,
        plan: data.plan,
        orders: data.orders,
        visitedAt: data.visitedAt,
        visitDuration: data.visitDuration,
        recordedBy: data.recordedBy,
      },
    });
  }

  async findRecordById(id: string): Promise<RoundRecord | null> {
    return this.prisma.roundRecord.findUnique({
      where: { id },
    });
  }

  async findRecordByRoundAndAdmission(
    roundId: string,
    admissionId: string,
  ): Promise<RoundRecord | null> {
    return this.prisma.roundRecord.findUnique({
      where: {
        roundId_admissionId: {
          roundId,
          admissionId,
        },
      },
    });
  }

  async findRecordsByRound(roundId: string): Promise<RoundRecord[]> {
    return this.prisma.roundRecord.findMany({
      where: { roundId },
      orderBy: { visitOrder: 'asc' },
    });
  }

  async findPreviousRecords(admissionId: string, limitCount: number): Promise<RoundRecord[]> {
    return this.prisma.roundRecord.findMany({
      where: {
        admissionId,
        visitedAt: { not: null },
      },
      orderBy: { visitedAt: 'desc' },
      take: limitCount,
    });
  }

  async updateRecord(id: string, data: UpdateRoundRecordData): Promise<RoundRecord> {
    return this.prisma.roundRecord.update({
      where: { id },
      data,
    });
  }

  async getNextVisitOrder(roundId: string): Promise<number> {
    const lastRecord = await this.prisma.roundRecord.findFirst({
      where: { roundId },
      orderBy: { visitOrder: 'desc' },
      select: { visitOrder: true },
    });

    return (lastRecord?.visitOrder ?? 0) + 1;
  }

  async countRecordsByRound(roundId: string): Promise<number> {
    return this.prisma.roundRecord.count({
      where: { roundId },
    });
  }

  async countVisitedRecordsByRound(roundId: string): Promise<number> {
    return this.prisma.roundRecord.count({
      where: {
        roundId,
        visitedAt: { not: null },
      },
    });
  }

  async getNextRoundNumber(date: Date): Promise<string> {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    const sequence = await this.prisma.roundSequence.upsert({
      where: { date },
      update: { lastValue: { increment: 1 } },
      create: { date, lastValue: 1 },
    });

    const sequenceNumber = String(sequence.lastValue).padStart(2, '0');
    return `R${dateStr}${sequenceNumber}`;
  }
}
