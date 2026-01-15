import { Injectable, Logger } from '@nestjs/common';
import { AdmissionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma';
import { NursingNoteRepository } from './nursing-note.repository';
import {
  CreateNursingNoteDto,
  GetNursingNotesDto,
  NursingNoteResponseDto,
  PaginatedNursingNotesResponseDto,
} from './dto/nursing-note.dto';
import { AdmissionNotFoundException, AdmissionNotActiveException } from './exceptions';

/**
 * NursingNoteService implementation
 *
 * Handles nursing note creation and retrieval (SOAP format).
 * Reference: SDS Section 4.5 (Report Module)
 * Requirements: REQ-FR-036~038
 */
@Injectable()
export class NursingNoteService {
  private readonly logger = new Logger(NursingNoteService.name);

  constructor(
    private readonly noteRepo: NursingNoteRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create nursing note (SOAP format)
   */
  async create(
    admissionId: string,
    dto: CreateNursingNoteDto,
    userId: string,
  ): Promise<NursingNoteResponseDto> {
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

    // 2. Create nursing note
    const note = await this.noteRepo.create({
      admissionId,
      noteType: dto.noteType,
      subjective: dto.subjective,
      objective: dto.objective,
      assessment: dto.assessment,
      plan: dto.plan,
      recordedBy: userId,
      isSignificant: dto.isSignificant,
    });

    this.logger.log(
      `Nursing note created for admission ${admissionId} by user ${userId}, type: ${dto.noteType}`,
    );

    return this.toResponseDto(note);
  }

  /**
   * Get nursing notes by admission
   */
  async getByAdmission(
    admissionId: string,
    dto: GetNursingNotesDto,
  ): Promise<PaginatedNursingNotesResponseDto> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const result = await this.noteRepo.findByAdmission({
      admissionId,
      noteType: dto.noteType,
      isSignificant: dto.isSignificant,
      page: dto.page,
      limit: dto.limit,
    });

    return {
      data: result.data.map((note) => this.toResponseDto(note)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Get significant nursing notes
   */
  async getSignificant(admissionId: string): Promise<NursingNoteResponseDto[]> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const notes = await this.noteRepo.findSignificant(admissionId);

    return notes.map((note) => this.toResponseDto(note));
  }

  /**
   * Get latest nursing note
   */
  async getLatest(admissionId: string): Promise<NursingNoteResponseDto | null> {
    // Verify admission exists
    const admission = await this.prisma.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new AdmissionNotFoundException(admissionId);
    }

    const note = await this.noteRepo.findLatest(admissionId);

    if (!note) {
      return null;
    }

    return this.toResponseDto(note);
  }

  /**
   * Convert NursingNote entity to response DTO
   */
  private toResponseDto(note: {
    id: string;
    admissionId: string;
    noteType: string;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    recordedAt: Date;
    recordedBy: string;
    isSignificant: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): NursingNoteResponseDto {
    return {
      id: note.id,
      admissionId: note.admissionId,
      noteType: note.noteType as NursingNoteResponseDto['noteType'],
      subjective: note.subjective,
      objective: note.objective,
      assessment: note.assessment,
      plan: note.plan,
      recordedAt: note.recordedAt,
      recordedBy: note.recordedBy,
      isSignificant: note.isSignificant,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
