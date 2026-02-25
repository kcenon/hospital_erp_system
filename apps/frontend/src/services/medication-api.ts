import { apiGet, apiPost } from '@/lib/api-client';
import type {
  Medication,
  PaginatedMedications,
  ScheduleMedicationData,
  AdministerMedicationData,
  GetMedicationHistoryParams,
} from '@/types';

function buildHistoryQueryString(params: GetMedicationHistoryParams): string {
  const searchParams = new URLSearchParams();

  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.status) searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const medicationApi = {
  schedule: (admissionId: string, data: ScheduleMedicationData): Promise<Medication> => {
    return apiPost<Medication>(`/admissions/${admissionId}/medications`, data);
  },

  getHistory: (
    admissionId: string,
    params: GetMedicationHistoryParams = {},
  ): Promise<PaginatedMedications> => {
    return apiGet<PaginatedMedications>(
      `/admissions/${admissionId}/medications${buildHistoryQueryString(params)}`,
    );
  },

  getScheduled: (admissionId: string, date: string): Promise<Medication[]> => {
    return apiGet<Medication[]>(`/admissions/${admissionId}/medications/scheduled/${date}`);
  },

  administer: (
    admissionId: string,
    medicationId: string,
    data: AdministerMedicationData = {},
  ): Promise<Medication> => {
    return apiPost<Medication>(
      `/admissions/${admissionId}/medications/${medicationId}/administer`,
      data,
    );
  },

  hold: (admissionId: string, medicationId: string, reason: string): Promise<Medication> => {
    return apiPost<Medication>(`/admissions/${admissionId}/medications/${medicationId}/hold`, {
      reason,
    });
  },

  refuse: (admissionId: string, medicationId: string, reason: string): Promise<Medication> => {
    return apiPost<Medication>(`/admissions/${admissionId}/medications/${medicationId}/refuse`, {
      reason,
    });
  },
};
