import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Patient, PatientDetail, Prisma } from '@prisma/client';

export interface CreatePatientData {
  patientNumber: string;
  name: string;
  birthDate: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodType?: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  legacyPatientId?: string;
}

export interface UpdatePatientData {
  name?: string;
  birthDate?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodType?: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  legacyPatientId?: string;
}

export interface FindPatientsParams {
  search?: string;
  name?: string;
  patientNumber?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PatientWithDetail = Patient & {
  detail: PatientDetail | null;
};

@Injectable()
export class PatientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreatePatientData): Promise<Patient> {
    return this.prisma.patient.create({
      data: {
        patientNumber: data.patientNumber,
        name: data.name,
        birthDate: data.birthDate,
        gender: data.gender,
        bloodType: data.bloodType,
        phone: data.phone,
        address: data.address,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        legacyPatientId: data.legacyPatientId,
      },
    });
  }

  async findById(id: string): Promise<PatientWithDetail | null> {
    return this.prisma.patient.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        detail: true,
      },
    });
  }

  async findByPatientNumber(patientNumber: string): Promise<PatientWithDetail | null> {
    return this.prisma.patient.findFirst({
      where: {
        patientNumber,
        deletedAt: null,
      },
      include: {
        detail: true,
      },
    });
  }

  async findByLegacyId(legacyId: string): Promise<PatientWithDetail | null> {
    return this.prisma.patient.findFirst({
      where: {
        legacyPatientId: legacyId,
        deletedAt: null,
      },
      include: {
        detail: true,
      },
    });
  }

  async findAll(params: FindPatientsParams): Promise<PaginatedResult<PatientWithDetail>> {
    const {
      search,
      name,
      patientNumber,
      gender,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: Prisma.PatientWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { patientNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (patientNumber) {
      where.patientNumber = { contains: patientNumber, mode: 'insensitive' };
    }

    if (gender) {
      where.gender = gender;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'patientNumber', 'birthDate'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        include: { detail: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: sortOrder },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: UpdatePatientData): Promise<Patient> {
    return this.prisma.patient.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async search(query: string): Promise<PatientWithDetail[]> {
    return this.prisma.patient.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { patientNumber: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      include: { detail: true },
      take: 10,
      orderBy: { name: 'asc' },
    });
  }

  async createDetail(
    patientId: string,
    data: {
      ssnEncrypted?: Buffer;
      medicalHistoryEncrypted?: Buffer;
      allergiesEncrypted?: Buffer;
      insuranceType?: string;
      insuranceNumberEncrypted?: Buffer;
      insuranceCompany?: string;
      notes?: string;
    },
  ): Promise<PatientDetail> {
    return this.prisma.patientDetail.create({
      data: {
        patientId,
        ...data,
      },
    });
  }

  async updateDetail(
    patientId: string,
    data: {
      ssnEncrypted?: Buffer;
      medicalHistoryEncrypted?: Buffer;
      allergiesEncrypted?: Buffer;
      insuranceType?: string;
      insuranceNumberEncrypted?: Buffer;
      insuranceCompany?: string;
      notes?: string;
    },
  ): Promise<PatientDetail> {
    return this.prisma.patientDetail.update({
      where: { patientId },
      data,
    });
  }

  async findDetailByPatientId(patientId: string): Promise<PatientDetail | null> {
    return this.prisma.patientDetail.findUnique({
      where: { patientId },
    });
  }
}
