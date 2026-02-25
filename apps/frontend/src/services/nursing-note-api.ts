import { apiGet, apiPost } from '@/lib/api-client';
import type {
  NursingNote,
  PaginatedNursingNotes,
  CreateNursingNoteData,
  GetNursingNotesParams,
} from '@/types';

function buildQueryString(params: GetNursingNotesParams): string {
  const searchParams = new URLSearchParams();

  if (params.noteType) searchParams.set('noteType', params.noteType);
  if (params.isSignificant !== undefined)
    searchParams.set('isSignificant', String(params.isSignificant));
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const nursingNoteApi = {
  create: (admissionId: string, data: CreateNursingNoteData): Promise<NursingNote> => {
    return apiPost<NursingNote>(`/admissions/${admissionId}/notes`, data);
  },

  list: (
    admissionId: string,
    params: GetNursingNotesParams = {},
  ): Promise<PaginatedNursingNotes> => {
    return apiGet<PaginatedNursingNotes>(
      `/admissions/${admissionId}/notes${buildQueryString(params)}`,
    );
  },

  getSignificant: (admissionId: string): Promise<NursingNote[]> => {
    return apiGet<NursingNote[]>(`/admissions/${admissionId}/notes/significant`);
  },

  getLatest: (admissionId: string): Promise<NursingNote | null> => {
    return apiGet<NursingNote | null>(`/admissions/${admissionId}/notes/latest`);
  },
};
