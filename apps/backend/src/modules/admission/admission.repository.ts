import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import {
  Admission,
  AdmissionStatus,
  AdmissionType,
  Transfer,
  Discharge,
  DischargeType,
  Prisma,
} from '@prisma/client';

export interface CreateAdmissionData {
  patientId: string;
  bedId: string;
  admissionNumber: string;
  admissionDate: Date;
  admissionTime: string;
  admissionType: AdmissionType;
  diagnosis?: string;
  chiefComplaint?: string;
  attendingDoctorId: string;
  primaryNurseId?: string;
  expectedDischargeDate?: Date;
  notes?: string;
  status: AdmissionStatus;
  createdBy: string;
}

export interface UpdateAdmissionData {
  bedId?: string;
  diagnosis?: string;
  chiefComplaint?: string;
  attendingDoctorId?: string;
  primaryNurseId?: string;
  status?: AdmissionStatus;
  expectedDischargeDate?: Date;
  notes?: string;
}

export interface CreateTransferData {
  admissionId: string;
  fromBedId: string;
  toBedId: string;
  transferDate: Date;
  transferTime: string;
  reason: string;
  notes?: string;
  transferredBy: string;
}

export interface CreateDischargeData {
  admissionId: string;
  dischargeDate: Date;
  dischargeTime: string;
  dischargeType: DischargeType;
  dischargeDiagnosis?: string;
  dischargeSummary?: string;
  followUpInstructions?: string;
  followUpDate?: Date;
  dischargedBy: string;
}

export interface FindAdmissionsParams {
  patientId?: string;
  bedId?: string;
  floorId?: string;
  attendingDoctorId?: string;
  status?: AdmissionStatus;
  admissionDateFrom?: Date;
  admissionDateTo?: Date;
  search?: string;
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

export type AdmissionWithRelations = Admission & {
  transfers: Transfer[];
  discharge: Discharge | null;
};

@Injectable()
export class AdmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAdmissionData): Promise<Admission> {
    return this.prisma.admission.create({
      data: {
        patientId: data.patientId,
        bedId: data.bedId,
        admissionNumber: data.admissionNumber,
        admissionDate: data.admissionDate,
        admissionTime: data.admissionTime,
        admissionType: data.admissionType,
        diagnosis: data.diagnosis,
        chiefComplaint: data.chiefComplaint,
        attendingDoctorId: data.attendingDoctorId,
        primaryNurseId: data.primaryNurseId,
        expectedDischargeDate: data.expectedDischargeDate,
        notes: data.notes,
        status: data.status,
        createdBy: data.createdBy,
      },
    });
  }

  async findById(id: string): Promise<AdmissionWithRelations | null> {
    return this.prisma.admission.findUnique({
      where: { id },
      include: {
        transfers: {
          orderBy: { createdAt: 'desc' },
        },
        discharge: true,
      },
    });
  }

  async findByAdmissionNumber(admissionNumber: string): Promise<AdmissionWithRelations | null> {
    return this.prisma.admission.findUnique({
      where: { admissionNumber },
      include: {
        transfers: {
          orderBy: { createdAt: 'desc' },
        },
        discharge: true,
      },
    });
  }

  async findActiveByPatient(patientId: string): Promise<Admission | null> {
    return this.prisma.admission.findFirst({
      where: {
        patientId,
        status: AdmissionStatus.ACTIVE,
      },
    });
  }

  async findActiveByBed(bedId: string): Promise<Admission | null> {
    return this.prisma.admission.findFirst({
      where: {
        bedId,
        status: AdmissionStatus.ACTIVE,
      },
    });
  }

  async findAll(params: FindAdmissionsParams): Promise<PaginatedResult<AdmissionWithRelations>> {
    const {
      patientId,
      bedId,
      floorId: _floorId,
      attendingDoctorId,
      status,
      admissionDateFrom,
      admissionDateTo,
      search,
      page = 1,
      limit = 20,
    } = params;

    const where: Prisma.AdmissionWhereInput = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (bedId) {
      where.bedId = bedId;
    }

    if (attendingDoctorId) {
      where.attendingDoctorId = attendingDoctorId;
    }

    if (status) {
      where.status = status;
    }

    if (admissionDateFrom || admissionDateTo) {
      where.admissionDate = {};
      if (admissionDateFrom) {
        where.admissionDate.gte = admissionDateFrom;
      }
      if (admissionDateTo) {
        where.admissionDate.lte = admissionDateTo;
      }
    }

    if (search) {
      where.OR = [
        { admissionNumber: { contains: search, mode: 'insensitive' } },
        { diagnosis: { contains: search, mode: 'insensitive' } },
        { chiefComplaint: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.admission.findMany({
        where,
        include: {
          transfers: {
            orderBy: { createdAt: 'desc' },
          },
          discharge: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { admissionDate: 'desc' },
      }),
      this.prisma.admission.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByFloor(floorId: string, status?: AdmissionStatus): Promise<AdmissionWithRelations[]> {
    const beds = await this.prisma.bed.findMany({
      where: {
        room: {
          floorId,
        },
        isActive: true,
      },
      select: { id: true },
    });

    const bedIds = beds.map((bed) => bed.id);

    const where: Prisma.AdmissionWhereInput = {
      bedId: { in: bedIds },
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.admission.findMany({
      where,
      include: {
        transfers: {
          orderBy: { createdAt: 'desc' },
        },
        discharge: true,
      },
      orderBy: { admissionDate: 'desc' },
    });
  }

  async update(id: string, data: UpdateAdmissionData): Promise<Admission> {
    return this.prisma.admission.update({
      where: { id },
      data,
    });
  }

  async createTransfer(data: CreateTransferData): Promise<Transfer> {
    return this.prisma.transfer.create({
      data: {
        admissionId: data.admissionId,
        fromBedId: data.fromBedId,
        toBedId: data.toBedId,
        transferDate: data.transferDate,
        transferTime: data.transferTime,
        reason: data.reason,
        notes: data.notes,
        transferredBy: data.transferredBy,
      },
    });
  }

  async findTransfersByAdmission(admissionId: string): Promise<Transfer[]> {
    return this.prisma.transfer.findMany({
      where: { admissionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDischarge(data: CreateDischargeData): Promise<Discharge> {
    return this.prisma.discharge.create({
      data: {
        admissionId: data.admissionId,
        dischargeDate: data.dischargeDate,
        dischargeTime: data.dischargeTime,
        dischargeType: data.dischargeType,
        dischargeDiagnosis: data.dischargeDiagnosis,
        dischargeSummary: data.dischargeSummary,
        followUpInstructions: data.followUpInstructions,
        followUpDate: data.followUpDate,
        dischargedBy: data.dischargedBy,
      },
    });
  }

  async findDischargeByAdmission(admissionId: string): Promise<Discharge | null> {
    return this.prisma.discharge.findUnique({
      where: { admissionId },
    });
  }

  async countActiveAdmissions(): Promise<number> {
    return this.prisma.admission.count({
      where: { status: AdmissionStatus.ACTIVE },
    });
  }

  async countAdmissionsByDate(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.admission.count({
      where: {
        admissionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  }

  async countDischargesByDate(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.discharge.count({
      where: {
        dischargeDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  }
}
