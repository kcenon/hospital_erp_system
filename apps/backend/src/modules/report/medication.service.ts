import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { AdmissionStatus, MedicationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma';
import { MedicationRepository } from './medication.repository';
import {
  ScheduleMedicationDto,
  AdministerMedicationDto,
  HoldMedicationDto,
  RefuseMedicationDto,
  GetMedicationHistoryDto,
  MedicationResponseDto,
  PaginatedMedicationResponseDto,
} from './dto/medication.dto';
import { AdmissionNotFoundException, AdmissionNotActiveException } from './exceptions';

/**
 * MedicationService implementation
 *
 * Handles medication scheduling and administration tracking.
 * Reference: SDS Section 4.5 (Report Module)
 * Requirements: REQ-FR-036~038
 */
@Injectable()
export class MedicationService {
  private readonly logger = new Logger(MedicationService.name);

  constructor(
    private readonly medicationRepo: MedicationRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Schedule medication
   */
  async schedule(admissionId: string, dto: ScheduleMedicationDto): Promise<MedicationResponseDto> {
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

    // 2. Create medication record
    const medication = await this.medicationRepo.create({
      admissionId,
      medicationName: dto.medicationName,
      dosage: dto.dosage,
      route: dto.route,
      frequency: dto.frequency,
      scheduledTime: dto.scheduledTime ? new Date(dto.scheduledTime) : undefined,
      notes: dto.notes,
    });

    this.logger.log(`Medication scheduled for admission ${admissionId}: ${dto.medicationName}`);

    return this.toResponseDto(medication);
  }

  /**
   * Administer medication
   */
  async administer(
    medicationId: string,
    dto: AdministerMedicationDto,
    userId: string,
  ): Promise<MedicationResponseDto> {
    // 1. Find medication
    const medication = await this.medicationRepo.findById(medicationId);

    if (!medication) {
      throw new NotFoundException(`Medication ${medicationId} not found`);
    }

    if (medication.status !== MedicationStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot administer medication with status ${medication.status}`,
      );
    }

    // 2. Update medication status
    const administeredAt = dto.administeredAt ? new Date(dto.administeredAt) : new Date();
    const updated = await this.medicationRepo.update(medicationId, {
      status: MedicationStatus.ADMINISTERED,
      administeredAt,
      administeredBy: userId,
      notes: dto.notes ?? medication.notes,
    });

    this.logger.log(`Medication ${medicationId} administered by user ${userId}`);

    return this.toResponseDto(updated);
  }

  /**
   * Hold medication
   */
  async hold(
    medicationId: string,
    dto: HoldMedicationDto,
    userId: string,
  ): Promise<MedicationResponseDto> {
    // 1. Find medication
    const medication = await this.medicationRepo.findById(medicationId);

    if (!medication) {
      throw new NotFoundException(`Medication ${medicationId} not found`);
    }

    if (medication.status !== MedicationStatus.SCHEDULED) {
      throw new BadRequestException(`Cannot hold medication with status ${medication.status}`);
    }

    // 2. Update medication status
    const updated = await this.medicationRepo.update(medicationId, {
      status: MedicationStatus.HELD,
      holdReason: dto.reason,
    });

    this.logger.log(`Medication ${medicationId} held by user ${userId}: ${dto.reason}`);

    return this.toResponseDto(updated);
  }

  /**
   * Refuse medication
   */
  async refuse(
    medicationId: string,
    dto: RefuseMedicationDto,
    userId: string,
  ): Promise<MedicationResponseDto> {
    // 1. Find medication
    const medication = await this.medicationRepo.findById(medicationId);

    if (!medication) {
      throw new NotFoundException(`Medication ${medicationId} not found`);
    }

    if (medication.status !== MedicationStatus.SCHEDULED) {
      throw new BadRequestException(`Cannot refuse medication with status ${medication.status}`);
    }

    // 2. Update medication status
    const updated = await this.medicationRepo.update(medicationId, {
      status: MedicationStatus.REFUSED,
      holdReason: dto.reason,
    });

    this.logger.log(
      `Medication ${medicationId} refused, recorded by user ${userId}: ${dto.reason}`,
    );

    return this.toResponseDto(updated);
  }

  /**
   * Get scheduled medications for a date
   */
  async getScheduled(admissionId: string, date: Date): Promise<MedicationResponseDto[]> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const medications = await this.medicationRepo.findScheduledByDate(admissionId, date);

    return medications.map((m) => this.toResponseDto(m));
  }

  /**
   * Get medication history
   */
  async getHistory(
    admissionId: string,
    dto: GetMedicationHistoryDto,
  ): Promise<PaginatedMedicationResponseDto> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const result = await this.medicationRepo.findByAdmission({
      admissionId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      status: dto.status,
      page: dto.page,
      limit: dto.limit,
    });

    return {
      data: result.data.map((m) => this.toResponseDto(m)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Convert Medication entity to response DTO
   */
  private toResponseDto(medication: {
    id: string;
    admissionId: string;
    medicationName: string;
    dosage: string;
    route: string;
    frequency: string | null;
    scheduledTime: Date | null;
    administeredAt: Date | null;
    administeredBy: string | null;
    status: string;
    holdReason: string | null;
    notes: string | null;
    createdAt: Date;
  }): MedicationResponseDto {
    return {
      id: medication.id,
      admissionId: medication.admissionId,
      medicationName: medication.medicationName,
      dosage: medication.dosage,
      route: medication.route as MedicationResponseDto['route'],
      frequency: medication.frequency,
      scheduledTime: medication.scheduledTime,
      administeredAt: medication.administeredAt,
      administeredBy: medication.administeredBy,
      status: medication.status as MedicationResponseDto['status'],
      holdReason: medication.holdReason,
      notes: medication.notes,
      createdAt: medication.createdAt,
    };
  }
}
