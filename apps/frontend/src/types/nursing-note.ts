export type NoteType = 'ASSESSMENT' | 'PROGRESS' | 'PROCEDURE' | 'HANDOFF';

export interface NursingNote {
  id: string;
  admissionId: string;
  noteType: NoteType;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  recordedAt: string;
  recordedBy: string;
  isSignificant: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNursingNotes {
  data: NursingNote[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateNursingNoteData {
  noteType: NoteType;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  isSignificant: boolean;
}

export interface GetNursingNotesParams {
  noteType?: NoteType;
  isSignificant?: boolean;
  page?: number;
  limit?: number;
}
