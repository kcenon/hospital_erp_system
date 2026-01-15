import { apiGet, apiPost, apiPatch } from '@/lib/api-client';
import type {
  Round,
  RoundRecord,
  PaginatedRounds,
  FindRoundsParams,
  CreateRoundData,
  CreateRoundRecordData,
  UpdateRoundRecordData,
  RoundingPatientList,
} from '@/types';

function buildQueryString(params: FindRoundsParams): string {
  const searchParams = new URLSearchParams();

  if (params.floorId) searchParams.set('floorId', params.floorId);
  if (params.leadDoctorId) searchParams.set('leadDoctorId', params.leadDoctorId);
  if (params.status) searchParams.set('status', params.status);
  if (params.roundType) searchParams.set('roundType', params.roundType);
  if (params.scheduledDateFrom) searchParams.set('scheduledDateFrom', params.scheduledDateFrom);
  if (params.scheduledDateTo) searchParams.set('scheduledDateTo', params.scheduledDateTo);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const roundingApi = {
  // Round CRUD operations
  create: (data: CreateRoundData): Promise<Round> => {
    return apiPost<Round>('/rounds', data);
  },

  findAll: (params: FindRoundsParams = {}): Promise<PaginatedRounds> => {
    return apiGet<PaginatedRounds>(`/rounds${buildQueryString(params)}`);
  },

  findById: (id: string): Promise<Round> => {
    return apiGet<Round>(`/rounds/${id}`);
  },

  findByRoundNumber: (roundNumber: string): Promise<Round> => {
    return apiGet<Round>(`/rounds/by-number/${roundNumber}`);
  },

  // Round state transitions
  start: (id: string): Promise<Round> => {
    return apiPost<Round>(`/rounds/${id}/start`);
  },

  pause: (id: string): Promise<Round> => {
    return apiPost<Round>(`/rounds/${id}/pause`);
  },

  resume: (id: string): Promise<Round> => {
    return apiPost<Round>(`/rounds/${id}/resume`);
  },

  complete: (id: string): Promise<Round> => {
    return apiPost<Round>(`/rounds/${id}/complete`);
  },

  cancel: (id: string): Promise<Round> => {
    return apiPost<Round>(`/rounds/${id}/cancel`);
  },

  // Patient list for rounding
  getPatientList: (roundId: string): Promise<RoundingPatientList> => {
    return apiGet<RoundingPatientList>(`/rounds/${roundId}/patients`);
  },

  // Round records
  getRecords: (roundId: string): Promise<RoundRecord[]> => {
    return apiGet<RoundRecord[]>(`/rounds/${roundId}/records`);
  },

  addRecord: (roundId: string, data: CreateRoundRecordData): Promise<RoundRecord> => {
    return apiPost<RoundRecord>(`/rounds/${roundId}/records`, data);
  },

  updateRecord: (
    roundId: string,
    recordId: string,
    data: UpdateRoundRecordData,
  ): Promise<RoundRecord> => {
    return apiPatch<RoundRecord>(`/rounds/${roundId}/records/${recordId}`, data);
  },
};
