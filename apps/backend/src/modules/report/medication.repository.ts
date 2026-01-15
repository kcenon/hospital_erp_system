import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Medication, MedicationRoute, MedicationStatus, Prisma } from '@prisma/client';
import { PaginatedResult } from './interfaces';

export interface CreateMedicationData {
  admissionId: string;
  medicationName: string;
  dosage: string;
  route: MedicationRoute;
  frequency?: string;
  scheduledTime?: Date;
  notes?: string;
}

export interface FindMedicationParams {
  admissionId: string;
  startDate?: Date;
  endDate?: Date;
  status?: MedicationStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class MedicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new medication schedule
   */
  async create(data: CreateMedicationData): Promise<Medication> {
    return this.prisma.medication.create({
      data: {
        admissionId: data.admissionId,
        medicationName: data.medicationName,
        dosage: data.dosage,
        route: data.route,
        frequency: data.frequency ?? null,
        scheduledTime: data.scheduledTime ?? null,
        status: MedicationStatus.SCHEDULED,
        notes: data.notes ?? null,
      },
    });
  }

  /**
   * Find medication by ID
   */
  async findById(id: string): Promise<Medication | null> {
    return this.prisma.medication.findUnique({
      where: { id },
    });
  }

  /**
   * Update medication
   */
  async update(id: string, data: Partial<Medication>): Promise<Medication> {
    return this.prisma.medication.update({
      where: { id },
      data,
    });
  }

  /**
   * Find medications by admission with pagination
   */
  async findByAdmission(params: FindMedicationParams): Promise<PaginatedResult<Medication>> {
    const { admissionId, startDate, endDate, status, page = 1, limit = 20 } = params;

    const where: Prisma.MedicationWhereInput = {
      admissionId,
    };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.medication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.medication.count({ where }),
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
   * Find scheduled medications for a specific date
   */
  async findScheduledByDate(admissionId: string, date: Date): Promise<Medication[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.medication.findMany({
      where: {
        admissionId,
        status: MedicationStatus.SCHEDULED,
        OR: [
          {
            scheduledTime: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          {
            scheduledTime: null,
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        ],
      },
      orderBy: { scheduledTime: 'asc' },
    });
  }

  /**
   * Find medications administered today
   */
  async findAdministeredToday(admissionId: string): Promise<Medication[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.medication.findMany({
      where: {
        admissionId,
        status: MedicationStatus.ADMINISTERED,
        administeredAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { administeredAt: 'desc' },
    });
  }

  /**
   * Count scheduled medications for admission
   */
  async countScheduled(admissionId: string): Promise<number> {
    return this.prisma.medication.count({
      where: {
        admissionId,
        status: MedicationStatus.SCHEDULED,
      },
    });
  }
}
