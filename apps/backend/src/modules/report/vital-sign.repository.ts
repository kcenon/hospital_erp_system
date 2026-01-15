import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { VitalSign, Consciousness, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaginatedResult } from './interfaces';

export interface CreateVitalSignData {
  admissionId: string;
  temperature?: number;
  systolicBp?: number;
  diastolicBp?: number;
  pulseRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  bloodGlucose?: number;
  painScore?: number;
  consciousness?: Consciousness;
  measuredAt: Date;
  measuredBy: string;
  notes?: string;
  hasAlert: boolean;
}

export interface FindVitalSignsParams {
  admissionId: string;
  startDate?: Date;
  endDate?: Date;
  hasAlert?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class VitalSignRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new vital sign record
   */
  async create(data: CreateVitalSignData): Promise<VitalSign> {
    return this.prisma.vitalSign.create({
      data: {
        admissionId: data.admissionId,
        temperature: data.temperature ? new Decimal(data.temperature) : null,
        systolicBp: data.systolicBp ?? null,
        diastolicBp: data.diastolicBp ?? null,
        pulseRate: data.pulseRate ?? null,
        respiratoryRate: data.respiratoryRate ?? null,
        oxygenSaturation: data.oxygenSaturation ?? null,
        bloodGlucose: data.bloodGlucose ?? null,
        painScore: data.painScore ?? null,
        consciousness: data.consciousness ?? null,
        measuredAt: data.measuredAt,
        measuredBy: data.measuredBy,
        notes: data.notes ?? null,
        hasAlert: data.hasAlert,
      },
    });
  }

  /**
   * Find vital sign by ID
   */
  async findById(id: string): Promise<VitalSign | null> {
    return this.prisma.vitalSign.findUnique({
      where: { id },
    });
  }

  /**
   * Find vital signs by admission with pagination
   */
  async findByAdmission(params: FindVitalSignsParams): Promise<PaginatedResult<VitalSign>> {
    const { admissionId, startDate, endDate, hasAlert, page = 1, limit = 20 } = params;

    const where: Prisma.VitalSignWhereInput = {
      admissionId,
    };

    if (startDate || endDate) {
      where.measuredAt = {};
      if (startDate) {
        where.measuredAt.gte = startDate;
      }
      if (endDate) {
        where.measuredAt.lte = endDate;
      }
    }

    if (hasAlert !== undefined) {
      where.hasAlert = hasAlert;
    }

    const [data, total] = await Promise.all([
      this.prisma.vitalSign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { measuredAt: 'desc' },
      }),
      this.prisma.vitalSign.count({ where }),
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
   * Find latest vital sign for an admission
   */
  async findLatest(admissionId: string): Promise<VitalSign | null> {
    return this.prisma.vitalSign.findFirst({
      where: { admissionId },
      orderBy: { measuredAt: 'desc' },
    });
  }

  /**
   * Find vital signs by date range for trend data
   */
  async findByDateRange(admissionId: string, startDate: Date, endDate: Date): Promise<VitalSign[]> {
    return this.prisma.vitalSign.findMany({
      where: {
        admissionId,
        measuredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { measuredAt: 'asc' },
    });
  }

  /**
   * Find vital signs with alerts for an admission
   */
  async findWithAlerts(admissionId: string): Promise<VitalSign[]> {
    return this.prisma.vitalSign.findMany({
      where: {
        admissionId,
        hasAlert: true,
      },
      orderBy: { measuredAt: 'desc' },
    });
  }

  /**
   * Count vital signs for an admission
   */
  async countByAdmission(admissionId: string): Promise<number> {
    return this.prisma.vitalSign.count({
      where: { admissionId },
    });
  }

  /**
   * Count vital signs with alerts for an admission
   */
  async countAlertsToday(admissionId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.vitalSign.count({
      where: {
        admissionId,
        hasAlert: true,
        measuredAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  }
}
