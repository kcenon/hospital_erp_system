import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VitalSign, AdmissionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma';
import { VitalSignRepository } from './vital-sign.repository';
import { VitalSigns, VitalAlert } from './value-objects';
import {
  RecordVitalSignsDto,
  GetVitalHistoryDto,
  GetTrendDto,
  VitalSignResponseDto,
  PaginatedVitalSignsResponseDto,
  VitalTrendResponseDto,
} from './dto';
import {
  AdmissionNotFoundException,
  AdmissionNotActiveException,
} from './exceptions';
import { RoomGateway } from '../room/room.gateway';
import { BedService } from '../room/bed.service';
import { BedWithRoom } from '../room/interfaces';

/**
 * VitalSign alert event payload
 */
export interface VitalAlertEventPayload {
  admissionId: string;
  vitalSignId: string;
  alerts: VitalAlert[];
  patientName: string;
  bedInfo: string;
}

/**
 * VitalSignService implementation
 *
 * Handles vital sign recording, history retrieval, and alert detection.
 * Reference: SDS Section 4.5 (Report Module)
 * Requirements: REQ-FR-030~035
 */
@Injectable()
export class VitalSignService {
  private readonly logger = new Logger(VitalSignService.name);

  constructor(
    private readonly vitalRepo: VitalSignRepository,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly roomGateway: RoomGateway,
    private readonly bedService: BedService,
  ) {}

  /**
   * Record vital signs (REQ-FR-030)
   */
  async record(
    admissionId: string,
    dto: RecordVitalSignsDto,
    userId: string,
  ): Promise<VitalSignResponseDto> {
    // 1. Validate admission is active
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        vitalSigns: false,
      },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    if (admission.status !== AdmissionStatus.ACTIVE) {
      throw new AdmissionNotActiveException(admissionId);
    }

    // 2. Create value object (validates ranges)
    const vitals = new VitalSigns(
      dto.temperature ?? null,
      dto.systolicBp ?? null,
      dto.diastolicBp ?? null,
      dto.pulseRate ?? null,
      dto.respiratoryRate ?? null,
      dto.oxygenSaturation ?? null,
      dto.bloodGlucose ?? null,
      dto.painScore ?? null,
      dto.consciousness ?? null,
    );

    // 3. Check for alerts
    const alerts = vitals.getAlerts();
    const hasAlert = alerts.length > 0;

    // 4. Save record
    const measuredAt = dto.measuredAt ? new Date(dto.measuredAt) : new Date();
    const vitalSign = await this.vitalRepo.create({
      admissionId,
      temperature: dto.temperature,
      systolicBp: dto.systolicBp,
      diastolicBp: dto.diastolicBp,
      pulseRate: dto.pulseRate,
      respiratoryRate: dto.respiratoryRate,
      oxygenSaturation: dto.oxygenSaturation,
      bloodGlucose: dto.bloodGlucose,
      painScore: dto.painScore,
      consciousness: dto.consciousness,
      measuredAt,
      measuredBy: userId,
      notes: dto.notes,
      hasAlert,
    });

    // 5. Emit alert event if abnormal
    if (hasAlert) {
      await this.handleAlerts(admission, vitalSign, alerts);
    }

    return this.toResponseDto(vitalSign, alerts);
  }

  /**
   * Get vital signs history (REQ-FR-031)
   */
  async getHistory(
    admissionId: string,
    dto: GetVitalHistoryDto,
  ): Promise<PaginatedVitalSignsResponseDto> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const result = await this.vitalRepo.findByAdmission({
      admissionId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      hasAlert: dto.hasAlert,
      page: dto.page,
      limit: dto.limit,
    });

    return {
      data: result.data.map((vs) => this.toResponseDto(vs)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Get latest vital signs
   */
  async getLatest(admissionId: string): Promise<VitalSignResponseDto | null> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const vitalSign = await this.vitalRepo.findLatest(admissionId);
    if (!vitalSign) {
      return null;
    }

    return this.toResponseDto(vitalSign);
  }

  /**
   * Get vital signs for trend graph (REQ-FR-032)
   */
  async getTrendData(
    admissionId: string,
    dto: GetTrendDto,
  ): Promise<VitalTrendResponseDto> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const vitals = await this.vitalRepo.findByDateRange(
      admissionId,
      startDate,
      endDate,
    );

    return {
      labels: vitals.map((v) => v.measuredAt),
      temperature: vitals.map((v) =>
        v.temperature ? Number(v.temperature) : null,
      ),
      systolicBp: vitals.map((v) => v.systolicBp),
      diastolicBp: vitals.map((v) => v.diastolicBp),
      pulseRate: vitals.map((v) => v.pulseRate),
      respiratoryRate: vitals.map((v) => v.respiratoryRate),
      oxygenSaturation: vitals.map((v) => v.oxygenSaturation),
    };
  }

  /**
   * Handle alert processing and broadcasting
   */
  private async handleAlerts(
    admission: { id: string; bedId: string; patientId: string },
    vitalSign: VitalSign,
    alerts: VitalAlert[],
  ): Promise<void> {
    try {
      // Get patient and bed info
      const [patient, bed] = await Promise.all([
        this.prisma.patient.findUnique({
          where: { id: admission.patientId },
          select: { name: true },
        }),
        this.bedService.findById(admission.bedId),
      ]);

      const bedWithRoom = bed as unknown as BedWithRoom;
      const bedInfo = `${bedWithRoom.room.roomNumber}-${bedWithRoom.bedNumber}`;
      const patientName = patient?.name || 'Unknown';

      // Emit event for other services
      const eventPayload: VitalAlertEventPayload = {
        admissionId: admission.id,
        vitalSignId: vitalSign.id,
        alerts,
        patientName,
        bedInfo,
      };
      this.eventEmitter.emit('vital.alert', eventPayload);

      // Broadcast via WebSocket
      const highestSeverity = this.getHighestSeverity(alerts);
      await this.roomGateway.server.emit('vital:alert', {
        type: 'VITAL_ALERT',
        admissionId: admission.id,
        alerts,
        patientName,
        bedInfo,
        severity: highestSeverity,
        timestamp: new Date(),
      });

      this.logger.log(
        `Vital alert emitted for admission ${admission.id}: ${alerts.length} alerts`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to handle vital alerts: ${message}`);
    }
  }

  /**
   * Get highest severity from alerts
   */
  private getHighestSeverity(
    alerts: VitalAlert[],
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
    for (const severity of severityOrder) {
      if (alerts.some((a) => a.severity === severity)) {
        return severity;
      }
    }
    return 'LOW';
  }

  /**
   * Convert VitalSign entity to response DTO
   */
  private toResponseDto(
    vitalSign: VitalSign,
    alerts?: VitalAlert[],
  ): VitalSignResponseDto {
    // If alerts not provided and hasAlert is true, compute them
    let computedAlerts = alerts;
    if (!computedAlerts && vitalSign.hasAlert) {
      const vitals = new VitalSigns(
        vitalSign.temperature ? Number(vitalSign.temperature) : null,
        vitalSign.systolicBp,
        vitalSign.diastolicBp,
        vitalSign.pulseRate,
        vitalSign.respiratoryRate,
        vitalSign.oxygenSaturation,
        vitalSign.bloodGlucose,
        vitalSign.painScore,
        vitalSign.consciousness,
      );
      computedAlerts = vitals.getAlerts();
    }

    return {
      id: vitalSign.id,
      admissionId: vitalSign.admissionId,
      temperature: vitalSign.temperature
        ? Number(vitalSign.temperature)
        : null,
      systolicBp: vitalSign.systolicBp,
      diastolicBp: vitalSign.diastolicBp,
      pulseRate: vitalSign.pulseRate,
      respiratoryRate: vitalSign.respiratoryRate,
      oxygenSaturation: vitalSign.oxygenSaturation,
      bloodGlucose: vitalSign.bloodGlucose,
      painScore: vitalSign.painScore,
      consciousness: vitalSign.consciousness,
      measuredAt: vitalSign.measuredAt,
      measuredBy: vitalSign.measuredBy,
      notes: vitalSign.notes,
      hasAlert: vitalSign.hasAlert,
      alerts: computedAlerts,
      createdAt: vitalSign.createdAt,
    };
  }
}
