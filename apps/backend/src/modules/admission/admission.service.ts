import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Admission, Transfer, Discharge, AdmissionStatus, BedStatus } from '@prisma/client';
import {
  AdmissionRepository,
  AdmissionWithRelations,
  PaginatedResult,
} from './admission.repository';
import { AdmissionNumberGenerator } from './admission-number.generator';
import { BedService } from '../room/bed.service';
import {
  CreateAdmissionDto,
  TransferDto,
  DischargeDto,
  FindAdmissionsDto,
  AdmissionResponseDto,
  PaginatedAdmissionsResponseDto,
  TransferResponseDto,
  DischargeResponseDto,
} from './dto';
import {
  PatientNotFoundException,
  AdmissionNotFoundException,
  PatientAlreadyAdmittedException,
  BedNotAvailableException,
  AdmissionNotActiveException,
  AdmissionAlreadyDischargedException,
} from './exceptions';

@Injectable()
export class AdmissionService {
  constructor(
    private readonly repository: AdmissionRepository,
    private readonly admissionNumberGenerator: AdmissionNumberGenerator,
    private readonly bedService: BedService,
    private readonly prisma: PrismaService,
  ) {}

  async admitPatient(
    dto: CreateAdmissionDto,
    userId: string,
  ): Promise<AdmissionResponseDto> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, deletedAt: null },
    });
    if (!patient) {
      throw new PatientNotFoundException(dto.patientId);
    }

    const existingAdmission = await this.repository.findActiveByPatient(dto.patientId);
    if (existingAdmission) {
      throw new PatientAlreadyAdmittedException(dto.patientId);
    }

    const bed = await this.bedService.findById(dto.bedId);
    if (bed.status !== BedStatus.EMPTY && bed.status !== BedStatus.RESERVED) {
      throw new BedNotAvailableException(dto.bedId);
    }

    const admissionNumber = await this.admissionNumberGenerator.generate();

    const admission = await this.prisma.$transaction(async (tx) => {
      const newAdmission = await tx.admission.create({
        data: {
          patientId: dto.patientId,
          bedId: dto.bedId,
          admissionNumber,
          admissionDate: new Date(dto.admissionDate),
          admissionTime: dto.admissionTime,
          admissionType: dto.admissionType,
          diagnosis: dto.diagnosis,
          chiefComplaint: dto.chiefComplaint,
          attendingDoctorId: dto.attendingDoctorId,
          primaryNurseId: dto.primaryNurseId,
          expectedDischargeDate: dto.expectedDischargeDate
            ? new Date(dto.expectedDischargeDate)
            : null,
          notes: dto.notes,
          status: AdmissionStatus.ACTIVE,
          createdBy: userId,
        },
      });

      await tx.bed.update({
        where: { id: dto.bedId },
        data: {
          status: BedStatus.OCCUPIED,
          currentAdmissionId: newAdmission.id,
        },
      });

      return newAdmission;
    });

    const admissionWithRelations = await this.repository.findById(admission.id);
    return this.toResponseDto(admissionWithRelations!);
  }

  async transferPatient(
    admissionId: string,
    dto: TransferDto,
    userId: string,
  ): Promise<TransferResponseDto> {
    const admission = await this.repository.findById(admissionId);
    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    if (admission.status !== AdmissionStatus.ACTIVE) {
      throw new AdmissionNotActiveException(admissionId);
    }

    const newBed = await this.bedService.findById(dto.toBedId);
    if (newBed.status !== BedStatus.EMPTY && newBed.status !== BedStatus.RESERVED) {
      throw new BedNotAvailableException(dto.toBedId);
    }

    const oldBedId = admission.bedId;

    const transfer = await this.prisma.$transaction(async (tx) => {
      const newTransfer = await tx.transfer.create({
        data: {
          admissionId,
          fromBedId: oldBedId,
          toBedId: dto.toBedId,
          transferDate: new Date(dto.transferDate),
          transferTime: dto.transferTime,
          reason: dto.reason,
          notes: dto.notes,
          transferredBy: userId,
        },
      });

      await tx.bed.update({
        where: { id: oldBedId },
        data: {
          status: BedStatus.EMPTY,
          currentAdmissionId: null,
        },
      });

      await tx.bed.update({
        where: { id: dto.toBedId },
        data: {
          status: BedStatus.OCCUPIED,
          currentAdmissionId: admissionId,
        },
      });

      await tx.admission.update({
        where: { id: admissionId },
        data: { bedId: dto.toBedId },
      });

      return newTransfer;
    });

    return this.toTransferResponseDto(transfer);
  }

  async dischargePatient(
    admissionId: string,
    dto: DischargeDto,
    userId: string,
  ): Promise<DischargeResponseDto> {
    const admission = await this.repository.findById(admissionId);
    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    if (admission.status !== AdmissionStatus.ACTIVE) {
      throw new AdmissionNotActiveException(admissionId);
    }

    if (admission.discharge) {
      throw new AdmissionAlreadyDischargedException(admissionId);
    }

    const discharge = await this.prisma.$transaction(async (tx) => {
      const newDischarge = await tx.discharge.create({
        data: {
          admissionId,
          dischargeDate: new Date(dto.dischargeDate),
          dischargeTime: dto.dischargeTime,
          dischargeType: dto.dischargeType,
          dischargeDiagnosis: dto.dischargeDiagnosis,
          dischargeSummary: dto.dischargeSummary,
          followUpInstructions: dto.followUpInstructions,
          followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
          dischargedBy: userId,
        },
      });

      await tx.bed.update({
        where: { id: admission.bedId },
        data: {
          status: BedStatus.EMPTY,
          currentAdmissionId: null,
        },
      });

      await tx.admission.update({
        where: { id: admissionId },
        data: { status: AdmissionStatus.DISCHARGED },
      });

      return newDischarge;
    });

    return this.toDischargeResponseDto(discharge);
  }

  async findById(id: string): Promise<AdmissionResponseDto> {
    const admission = await this.repository.findById(id);
    if (!admission) {
      throw new AdmissionNotFoundException(id);
    }
    return this.toResponseDto(admission);
  }

  async findByAdmissionNumber(admissionNumber: string): Promise<AdmissionResponseDto> {
    const admission = await this.repository.findByAdmissionNumber(admissionNumber);
    if (!admission) {
      throw new AdmissionNotFoundException(admissionNumber);
    }
    return this.toResponseDto(admission);
  }

  async findAll(dto: FindAdmissionsDto): Promise<PaginatedAdmissionsResponseDto> {
    const result = await this.repository.findAll({
      patientId: dto.patientId,
      bedId: dto.bedId,
      floorId: dto.floorId,
      attendingDoctorId: dto.attendingDoctorId,
      status: dto.status,
      admissionDateFrom: dto.admissionDateFrom
        ? new Date(dto.admissionDateFrom)
        : undefined,
      admissionDateTo: dto.admissionDateTo
        ? new Date(dto.admissionDateTo)
        : undefined,
      search: dto.search,
      page: dto.page,
      limit: dto.limit,
    });

    return {
      data: result.data.map((admission) => this.toResponseDto(admission)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async findActiveByPatient(patientId: string): Promise<AdmissionResponseDto | null> {
    const admission = await this.repository.findActiveByPatient(patientId);
    if (!admission) {
      return null;
    }
    const admissionWithRelations = await this.repository.findById(admission.id);
    return admissionWithRelations ? this.toResponseDto(admissionWithRelations) : null;
  }

  async findByFloor(
    floorId: string,
    status?: AdmissionStatus,
  ): Promise<AdmissionResponseDto[]> {
    const admissions = await this.repository.findByFloor(floorId, status);
    return admissions.map((admission) => this.toResponseDto(admission));
  }

  async getTransferHistory(admissionId: string): Promise<TransferResponseDto[]> {
    const admission = await this.repository.findById(admissionId);
    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }
    return admission.transfers.map((transfer) => this.toTransferResponseDto(transfer));
  }

  private toResponseDto(admission: AdmissionWithRelations): AdmissionResponseDto {
    return {
      id: admission.id,
      patientId: admission.patientId,
      bedId: admission.bedId,
      admissionNumber: admission.admissionNumber,
      admissionDate: admission.admissionDate,
      admissionTime: admission.admissionTime,
      admissionType: admission.admissionType,
      diagnosis: admission.diagnosis,
      chiefComplaint: admission.chiefComplaint,
      attendingDoctorId: admission.attendingDoctorId,
      primaryNurseId: admission.primaryNurseId,
      status: admission.status,
      expectedDischargeDate: admission.expectedDischargeDate,
      notes: admission.notes,
      createdAt: admission.createdAt,
      updatedAt: admission.updatedAt,
      createdBy: admission.createdBy,
      transfers: admission.transfers.map((t) => this.toTransferResponseDto(t)),
      discharge: admission.discharge
        ? this.toDischargeResponseDto(admission.discharge)
        : null,
    };
  }

  private toTransferResponseDto(transfer: Transfer): TransferResponseDto {
    return {
      id: transfer.id,
      admissionId: transfer.admissionId,
      fromBedId: transfer.fromBedId,
      toBedId: transfer.toBedId,
      transferDate: transfer.transferDate,
      transferTime: transfer.transferTime,
      reason: transfer.reason,
      notes: transfer.notes,
      transferredBy: transfer.transferredBy,
      createdAt: transfer.createdAt,
    };
  }

  private toDischargeResponseDto(discharge: Discharge): DischargeResponseDto {
    return {
      id: discharge.id,
      admissionId: discharge.admissionId,
      dischargeDate: discharge.dischargeDate,
      dischargeTime: discharge.dischargeTime,
      dischargeType: discharge.dischargeType,
      dischargeDiagnosis: discharge.dischargeDiagnosis,
      dischargeSummary: discharge.dischargeSummary,
      followUpInstructions: discharge.followUpInstructions,
      followUpDate: discharge.followUpDate,
      dischargedBy: discharge.dischargedBy,
      createdAt: discharge.createdAt,
    };
  }
}
