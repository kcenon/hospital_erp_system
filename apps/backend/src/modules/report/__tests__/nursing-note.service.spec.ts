import { Test, TestingModule } from '@nestjs/testing';
import { AdmissionStatus, NoteType } from '@prisma/client';
import { NursingNoteService } from '../nursing-note.service';
import { NursingNoteRepository } from '../nursing-note.repository';
import { PrismaService } from '../../../prisma';
import {
  createTestNursingNote,
  createProgressNote,
  createAssessmentNote,
  createSignificantNote,
  createHandoffNote,
  createTestAdmission,
} from '../../../../test/factories';
import { createMockPrismaService } from '../../../../test/utils';
import { AdmissionNotFoundException, AdmissionNotActiveException } from '../exceptions';

describe('NursingNoteService', () => {
  let service: NursingNoteService;
  let noteRepo: jest.Mocked<NursingNoteRepository>;
  let prismaService: ReturnType<typeof createMockPrismaService>;

  const mockNoteRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByAdmission: jest.fn(),
    findSignificant: jest.fn(),
    findLatest: jest.fn(),
    countByAdmission: jest.fn(),
    countSignificantToday: jest.fn(),
  };

  beforeEach(async () => {
    prismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NursingNoteService,
        { provide: NursingNoteRepository, useValue: mockNoteRepo },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<NursingNoteService>(NursingNoteService);
    noteRepo = module.get(NursingNoteRepository);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const admissionId = 'admission-id';
    const userId = 'user-id';
    const dto = {
      noteType: NoteType.PROGRESS,
      subjective: 'Patient reports mild headache',
      objective: 'Vital signs stable, patient appears comfortable',
      assessment: 'Mild tension headache, likely due to stress',
      plan: 'Continue monitoring, administer PRN analgesic if needed',
      isSignificant: false,
    };

    it('should create nursing note successfully', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });
      const note = createProgressNote(admissionId, {
        recordedBy: userId,
      });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.create.mockResolvedValue(note);

      const result = await service.create(admissionId, dto, userId);

      expect(result.admissionId).toBe(admissionId);
      expect(result.noteType).toBe(NoteType.PROGRESS);
      expect(mockNoteRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          admissionId,
          noteType: dto.noteType,
          subjective: dto.subjective,
          objective: dto.objective,
          assessment: dto.assessment,
          plan: dto.plan,
          recordedBy: userId,
          isSignificant: dto.isSignificant,
        }),
      );
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.create(admissionId, dto, userId)).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });

    it('should throw when admission not active', async () => {
      const dischargedAdmission = createTestAdmission({
        id: admissionId,
        status: 'DISCHARGED' as AdmissionStatus,
      });
      prismaService.admission.findUnique.mockResolvedValue(dischargedAdmission);

      await expect(service.create(admissionId, dto, userId)).rejects.toThrow(
        AdmissionNotActiveException,
      );
    });

    it('should create note with minimal SOAP fields', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });
      const minimalDto = {
        noteType: NoteType.ASSESSMENT,
        isSignificant: false,
      };
      const note = createAssessmentNote(admissionId, {
        subjective: null,
        objective: null,
        assessment: null,
        plan: null,
      });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.create.mockResolvedValue(note);

      const result = await service.create(admissionId, minimalDto, userId);

      expect(result.noteType).toBe(NoteType.ASSESSMENT);
    });

    it('should create significant note', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });
      const significantDto = {
        noteType: NoteType.INCIDENT,
        subjective: 'Patient reports sudden onset of chest pain',
        objective: 'Patient diaphoretic, BP elevated',
        assessment: 'Possible cardiac event',
        plan: 'Notify physician stat',
        isSignificant: true,
      };
      const note = createSignificantNote(admissionId);

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.create.mockResolvedValue(note);

      const result = await service.create(admissionId, significantDto, userId);

      expect(result.isSignificant).toBe(true);
      expect(result.noteType).toBe(NoteType.INCIDENT);
    });

    it('should support all note types', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });

      const noteTypes = [
        NoteType.ASSESSMENT,
        NoteType.PROGRESS,
        NoteType.PROCEDURE,
        NoteType.INCIDENT,
        NoteType.HANDOFF,
      ];

      for (const noteType of noteTypes) {
        const typeDto = {
          noteType,
          isSignificant: false,
        };
        const note = createTestNursingNote({
          admissionId,
          noteType,
        });

        prismaService.admission.findUnique.mockResolvedValue(admission);
        mockNoteRepo.create.mockResolvedValue(note);

        const result = await service.create(admissionId, typeDto, userId);

        expect(result.noteType).toBe(noteType);
      }
    });
  });

  describe('getByAdmission', () => {
    const admissionId = 'admission-id';
    const dto = {
      page: 1,
      limit: 20,
    };

    it('should return nursing notes with pagination', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const notes = [createProgressNote(admissionId), createAssessmentNote(admissionId)];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findByAdmission.mockResolvedValue({
        data: notes,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.getByAdmission(admissionId, dto);

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should filter by note type', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const progressNotes = [createProgressNote(admissionId)];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findByAdmission.mockResolvedValue({
        data: progressNotes,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      await service.getByAdmission(admissionId, {
        ...dto,
        noteType: NoteType.PROGRESS,
      });

      expect(mockNoteRepo.findByAdmission).toHaveBeenCalledWith(
        expect.objectContaining({
          noteType: NoteType.PROGRESS,
        }),
      );
    });

    it('should filter by significant notes', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const significantNotes = [createSignificantNote(admissionId)];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findByAdmission.mockResolvedValue({
        data: significantNotes,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      await service.getByAdmission(admissionId, {
        ...dto,
        isSignificant: true,
      });

      expect(mockNoteRepo.findByAdmission).toHaveBeenCalledWith(
        expect.objectContaining({
          isSignificant: true,
        }),
      );
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.getByAdmission(admissionId, dto)).rejects.toThrow(
        AdmissionNotFoundException,
      );
    });

    it('should return empty array when no notes', async () => {
      const admission = createTestAdmission({ id: admissionId });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findByAdmission.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const result = await service.getByAdmission(admissionId, dto);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const notes = [createProgressNote(admissionId)];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findByAdmission.mockResolvedValue({
        data: notes,
        total: 50,
        page: 3,
        limit: 10,
        totalPages: 5,
      });

      const result = await service.getByAdmission(admissionId, {
        page: 3,
        limit: 10,
      });

      expect(result.page).toBe(3);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('getSignificant', () => {
    const admissionId = 'admission-id';

    it('should return significant notes', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const significantNotes = [createSignificantNote(admissionId), createHandoffNote(admissionId)];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findSignificant.mockResolvedValue(significantNotes);

      const result = await service.getSignificant(admissionId);

      expect(result.length).toBe(2);
      expect(result.every((note) => note.isSignificant)).toBe(true);
    });

    it('should return empty array when no significant notes', async () => {
      const admission = createTestAdmission({ id: admissionId });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findSignificant.mockResolvedValue([]);

      const result = await service.getSignificant(admissionId);

      expect(result).toEqual([]);
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.getSignificant(admissionId)).rejects.toThrow(AdmissionNotFoundException);
    });
  });

  describe('getLatest', () => {
    const admissionId = 'admission-id';

    it('should return latest nursing note', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const note = createProgressNote(admissionId);

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findLatest.mockResolvedValue(note);

      const result = await service.getLatest(admissionId);

      expect(result).not.toBeNull();
      expect(result!.admissionId).toBe(admissionId);
    });

    it('should return null when no notes exist', async () => {
      const admission = createTestAdmission({ id: admissionId });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findLatest.mockResolvedValue(null);

      const result = await service.getLatest(admissionId);

      expect(result).toBeNull();
    });

    it('should throw when admission not found', async () => {
      prismaService.admission.findUnique.mockResolvedValue(null);

      await expect(service.getLatest(admissionId)).rejects.toThrow(AdmissionNotFoundException);
    });
  });

  describe('SOAP format validation', () => {
    const admissionId = 'admission-id';
    const userId = 'user-id';

    it('should preserve all SOAP components', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });
      const soapNote = {
        noteType: NoteType.PROGRESS,
        subjective: 'S: Patient states feeling much better',
        objective: 'O: Afebrile, lungs clear bilateral',
        assessment: 'A: Condition improving, infection resolving',
        plan: 'P: Continue antibiotics, discharge tomorrow',
        isSignificant: false,
      };
      const createdNote = createProgressNote(admissionId, {
        subjective: soapNote.subjective,
        objective: soapNote.objective,
        assessment: soapNote.assessment,
        plan: soapNote.plan,
      });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.create.mockResolvedValue(createdNote);

      const result = await service.create(admissionId, soapNote, userId);

      expect(result.subjective).toBe(soapNote.subjective);
      expect(result.objective).toBe(soapNote.objective);
      expect(result.assessment).toBe(soapNote.assessment);
      expect(result.plan).toBe(soapNote.plan);
    });

    it('should allow partial SOAP entries', async () => {
      const admission = createTestAdmission({
        id: admissionId,
        status: 'ACTIVE' as AdmissionStatus,
      });
      const partialSoapNote = {
        noteType: NoteType.ASSESSMENT,
        subjective: 'Patient reports no complaints',
        objective: 'All systems within normal limits',
        isSignificant: false,
      };
      const createdNote = createAssessmentNote(admissionId, {
        subjective: partialSoapNote.subjective,
        objective: partialSoapNote.objective,
        assessment: null,
        plan: null,
      });

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.create.mockResolvedValue(createdNote);

      const result = await service.create(admissionId, partialSoapNote, userId);

      expect(result.subjective).toBe(partialSoapNote.subjective);
      expect(result.objective).toBe(partialSoapNote.objective);
      expect(result.assessment).toBeNull();
      expect(result.plan).toBeNull();
    });
  });

  describe('note types', () => {
    const admissionId = 'admission-id';

    it('should handle ASSESSMENT notes', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const assessmentNotes = [createAssessmentNote(admissionId)];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findByAdmission.mockResolvedValue({
        data: assessmentNotes,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.getByAdmission(admissionId, {
        noteType: NoteType.ASSESSMENT,
      });

      expect(result.data[0].noteType).toBe(NoteType.ASSESSMENT);
    });

    it('should handle PROGRESS notes', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const progressNotes = [createProgressNote(admissionId)];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findByAdmission.mockResolvedValue({
        data: progressNotes,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.getByAdmission(admissionId, {
        noteType: NoteType.PROGRESS,
      });

      expect(result.data[0].noteType).toBe(NoteType.PROGRESS);
    });

    it('should handle INCIDENT notes', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const incidentNotes = [createSignificantNote(admissionId)];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findByAdmission.mockResolvedValue({
        data: incidentNotes,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.getByAdmission(admissionId, {
        noteType: NoteType.INCIDENT,
      });

      expect(result.data[0].noteType).toBe(NoteType.INCIDENT);
    });

    it('should handle HANDOFF notes', async () => {
      const admission = createTestAdmission({ id: admissionId });
      const handoffNotes = [createHandoffNote(admissionId)];

      prismaService.admission.findUnique.mockResolvedValue(admission);
      mockNoteRepo.findByAdmission.mockResolvedValue({
        data: handoffNotes,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await service.getByAdmission(admissionId, {
        noteType: NoteType.HANDOFF,
      });

      expect(result.data[0].noteType).toBe(NoteType.HANDOFF);
    });
  });
});
