import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { DailyReport, PatientStatus, Prisma } from '@prisma/client';
import { PaginatedResult } from './interfaces';

export interface CreateDailyReportData {
  admissionId: string;
  reportDate: Date;
  vitalsSummary?: object | null;
  totalIntake?: number | null;
  totalOutput?: number | null;
  ioBalance?: number | null;
  medicationsGiven?: number | null;
  medicationsHeld?: number | null;
  patientStatus?: PatientStatus | null;
  summary?: string | null;
  alerts?: object[] | null;
  generatedBy?: string | null;
}

export interface FindDailyReportParams {
  admissionId: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class DailyReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or update (upsert) a daily report
   */
  async upsert(data: CreateDailyReportData): Promise<DailyReport> {
    // Handle JSON fields with Prisma.DbNull for null values
    const vitalsSummary = data.vitalsSummary ?? Prisma.DbNull;
    const alerts = data.alerts ?? Prisma.DbNull;

    return this.prisma.dailyReport.upsert({
      where: {
        admissionId_reportDate: {
          admissionId: data.admissionId,
          reportDate: data.reportDate,
        },
      },
      create: {
        admissionId: data.admissionId,
        reportDate: data.reportDate,
        vitalsSummary,
        totalIntake: data.totalIntake ?? null,
        totalOutput: data.totalOutput ?? null,
        ioBalance: data.ioBalance ?? null,
        medicationsGiven: data.medicationsGiven ?? null,
        medicationsHeld: data.medicationsHeld ?? null,
        patientStatus: data.patientStatus ?? null,
        summary: data.summary ?? null,
        alerts,
        generatedAt: new Date(),
        generatedBy: data.generatedBy ?? null,
      },
      update: {
        vitalsSummary,
        totalIntake: data.totalIntake ?? null,
        totalOutput: data.totalOutput ?? null,
        ioBalance: data.ioBalance ?? null,
        medicationsGiven: data.medicationsGiven ?? null,
        medicationsHeld: data.medicationsHeld ?? null,
        patientStatus: data.patientStatus ?? null,
        summary: data.summary ?? null,
        alerts,
        generatedAt: new Date(),
        generatedBy: data.generatedBy ?? null,
      },
    });
  }

  /**
   * Find daily report by ID
   */
  async findById(id: string): Promise<DailyReport | null> {
    return this.prisma.dailyReport.findUnique({
      where: { id },
    });
  }

  /**
   * Find daily report by admission and date
   */
  async findByAdmissionAndDate(admissionId: string, reportDate: Date): Promise<DailyReport | null> {
    return this.prisma.dailyReport.findUnique({
      where: {
        admissionId_reportDate: {
          admissionId,
          reportDate,
        },
      },
    });
  }

  /**
   * Find daily reports by admission with pagination
   */
  async findByAdmission(params: FindDailyReportParams): Promise<PaginatedResult<DailyReport>> {
    const { admissionId, startDate, endDate, page = 1, limit = 20 } = params;

    const where: Prisma.DailyReportWhereInput = {
      admissionId,
    };

    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) {
        where.reportDate.gte = startDate;
      }
      if (endDate) {
        where.reportDate.lte = endDate;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.dailyReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { reportDate: 'desc' },
      }),
      this.prisma.dailyReport.count({ where }),
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
   * Find latest daily report for an admission
   */
  async findLatest(admissionId: string): Promise<DailyReport | null> {
    return this.prisma.dailyReport.findFirst({
      where: { admissionId },
      orderBy: { reportDate: 'desc' },
    });
  }

  /**
   * Delete daily report by ID
   */
  async delete(id: string): Promise<void> {
    await this.prisma.dailyReport.delete({
      where: { id },
    });
  }

  /**
   * Count reports for an admission
   */
  async countByAdmission(admissionId: string): Promise<number> {
    return this.prisma.dailyReport.count({
      where: { admissionId },
    });
  }
}
