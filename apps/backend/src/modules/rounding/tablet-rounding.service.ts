import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { AdmissionStatus, RoundStatus } from '@prisma/client';
import { RoundingRepository } from './rounding.repository';
import { RoundingPatientDto, RoundingPatientListDto, LatestVitalsDto } from './dto';
import {
  RoundNotFoundException,
  RoundNotInProgressException,
  AdmissionNotFoundException,
} from './exceptions';
import { CreateRoundRecordDto, UpdateRoundRecordDto, RoundRecordResponseDto } from './dto';

@Injectable()
export class TabletRoundingService {
  constructor(
    private readonly repository: RoundingRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getRoundingPatientList(roundId: string): Promise<RoundingPatientListDto> {
    const round = await this.repository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundException(roundId);
    }

    const beds = await this.prisma.bed.findMany({
      where: {
        room: {
          floorId: round.floorId,
        },
        isActive: true,
      },
      select: { id: true },
    });

    const bedIds = beds.map((b) => b.id);

    const admissions = await this.prisma.admission.findMany({
      where: {
        status: AdmissionStatus.ACTIVE,
        bedId: { in: bedIds },
      },
      include: {
        vitalSigns: {
          orderBy: { measuredAt: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        admissionDate: 'desc',
      },
    });

    const existingRecords = new Map(round.records.map((r) => [r.admissionId, r]));

    const patients: RoundingPatientDto[] = await Promise.all(
      admissions.map(async (admission) => {
        const [patient, bed, previousRecords] = await Promise.all([
          this.prisma.patient.findUnique({
            where: { id: admission.patientId },
          }),
          this.prisma.bed.findUnique({
            where: { id: admission.bedId },
            include: { room: true },
          }),
          this.repository.findPreviousRecords(admission.id, 3),
        ]);

        const existingRecord = existingRecords.get(admission.id);
        const latestVital = admission.vitalSigns[0];

        let latestVitals: LatestVitalsDto | null = null;
        if (latestVital) {
          latestVitals = {
            temperature: latestVital.temperature ? Number(latestVital.temperature) : null,
            bloodPressure:
              latestVital.systolicBp && latestVital.diastolicBp
                ? `${latestVital.systolicBp}/${latestVital.diastolicBp}`
                : '-',
            pulseRate: latestVital.pulseRate,
            respiratoryRate: latestVital.respiratoryRate,
            oxygenSaturation: latestVital.oxygenSaturation,
            consciousness: latestVital.consciousness,
            measuredAt: latestVital.measuredAt,
            hasAlert: latestVital.hasAlert,
          };
        }

        const birthDate = patient?.birthDate ? new Date(patient.birthDate) : new Date();
        const age = this.calculateAge(birthDate);
        const admissionDays = this.calculateAdmissionDays(admission.admissionDate);

        return {
          admissionId: admission.id,
          patient: {
            id: patient?.id ?? '',
            patientNumber: patient?.patientNumber ?? '',
            name: patient?.name ?? '',
            age,
            gender: patient?.gender ?? 'OTHER',
            birthDate,
          },
          bed: {
            id: bed?.id ?? '',
            roomNumber: bed?.room?.roomNumber ?? '',
            bedNumber: bed?.bedNumber ?? '',
            roomName: bed?.room?.name ?? null,
          },
          admission: {
            diagnosis: admission.diagnosis,
            chiefComplaint: admission.chiefComplaint,
            admissionDate: admission.admissionDate,
            admissionDays,
            admissionType: admission.admissionType,
            status: admission.status,
            attendingDoctorId: admission.attendingDoctorId,
          },
          latestVitals,
          previousRoundNote: previousRecords[0]?.observation ?? null,
          existingRecordId: existingRecord?.id ?? null,
          isVisited: existingRecord?.visitedAt !== null && existingRecord?.visitedAt !== undefined,
        };
      }),
    );

    const visitedCount = round.records.filter((r) => r.visitedAt !== null).length;
    const totalPatients = patients.length;

    return {
      roundId: round.id,
      roundNumber: round.roundNumber,
      patients,
      totalPatients,
      visitedCount,
      progress: totalPatients > 0 ? Math.round((visitedCount / totalPatients) * 100) : 0,
    };
  }

  async addRoundRecord(
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

    const admission = await this.prisma.admission.findUnique({
      where: { id: dto.admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(dto.admissionId);
    }

    const existingRecord = await this.repository.findRecordByRoundAndAdmission(
      roundId,
      dto.admissionId,
    );

    if (existingRecord) {
      const updatedRecord = await this.repository.updateRecord(existingRecord.id, {
        patientStatus: dto.patientStatus,
        chiefComplaint: dto.chiefComplaint,
        observation: dto.observation,
        assessment: dto.assessment,
        plan: dto.plan,
        orders: dto.orders,
        visitedAt: existingRecord.visitedAt ?? new Date(),
      });

      return this.toRecordResponseDto(updatedRecord);
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

  async updateRoundRecord(
    roundId: string,
    recordId: string,
    dto: UpdateRoundRecordDto,
  ): Promise<RoundRecordResponseDto> {
    const round = await this.repository.findById(roundId);
    if (!round) {
      throw new RoundNotFoundException(roundId);
    }

    const record = await this.repository.findRecordById(recordId);
    if (!record || record.roundId !== roundId) {
      throw new RoundNotFoundException(recordId);
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

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private calculateAdmissionDays(admissionDate: Date): number {
    const today = new Date();
    const diffTime = today.getTime() - new Date(admissionDate).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
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
