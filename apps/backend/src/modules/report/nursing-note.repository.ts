import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { NursingNote, NoteType, Prisma } from '@prisma/client';
import { PaginatedResult } from './interfaces';

export interface CreateNursingNoteData {
  admissionId: string;
  noteType: NoteType;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  recordedBy: string;
  isSignificant: boolean;
}

export interface FindNursingNotesParams {
  admissionId: string;
  noteType?: NoteType;
  isSignificant?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class NursingNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new nursing note
   */
  async create(data: CreateNursingNoteData): Promise<NursingNote> {
    return this.prisma.nursingNote.create({
      data: {
        admissionId: data.admissionId,
        noteType: data.noteType,
        subjective: data.subjective ?? null,
        objective: data.objective ?? null,
        assessment: data.assessment ?? null,
        plan: data.plan ?? null,
        recordedAt: new Date(),
        recordedBy: data.recordedBy,
        isSignificant: data.isSignificant,
      },
    });
  }

  /**
   * Find nursing note by ID
   */
  async findById(id: string): Promise<NursingNote | null> {
    return this.prisma.nursingNote.findUnique({
      where: { id },
    });
  }

  /**
   * Find nursing notes by admission with pagination
   */
  async findByAdmission(params: FindNursingNotesParams): Promise<PaginatedResult<NursingNote>> {
    const { admissionId, noteType, isSignificant, page = 1, limit = 20 } = params;

    const where: Prisma.NursingNoteWhereInput = {
      admissionId,
    };

    if (noteType) {
      where.noteType = noteType;
    }

    if (isSignificant !== undefined) {
      where.isSignificant = isSignificant;
    }

    const [data, total] = await Promise.all([
      this.prisma.nursingNote.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { recordedAt: 'desc' },
      }),
      this.prisma.nursingNote.count({ where }),
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
   * Find significant nursing notes
   */
  async findSignificant(admissionId: string): Promise<NursingNote[]> {
    return this.prisma.nursingNote.findMany({
      where: {
        admissionId,
        isSignificant: true,
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  /**
   * Find latest nursing note
   */
  async findLatest(admissionId: string): Promise<NursingNote | null> {
    return this.prisma.nursingNote.findFirst({
      where: { admissionId },
      orderBy: { recordedAt: 'desc' },
    });
  }

  /**
   * Count nursing notes for admission
   */
  async countByAdmission(admissionId: string): Promise<number> {
    return this.prisma.nursingNote.count({
      where: { admissionId },
    });
  }

  /**
   * Count significant notes today
   */
  async countSignificantToday(admissionId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.nursingNote.count({
      where: {
        admissionId,
        isSignificant: true,
        recordedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  }
}
