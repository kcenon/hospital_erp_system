import { apiGet } from '@/lib/api-client';
import type { Admission, PaginatedAdmissions } from '@/types';

interface FindAdmissionsParams {
  patientId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

function buildQueryString(params: FindAdmissionsParams): string {
  const searchParams = new URLSearchParams();

  if (params.patientId) searchParams.set('patientId', params.patientId);
  if (params.status) searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const admissionApi = {
  findAll: (params: FindAdmissionsParams = {}): Promise<PaginatedAdmissions> => {
    return apiGet<PaginatedAdmissions>(`/admissions${buildQueryString(params)}`);
  },

  findById: (id: string): Promise<Admission> => {
    return apiGet<Admission>(`/admissions/${id}`);
  },

  findByPatientId: (patientId: string): Promise<Admission[]> => {
    return apiGet<Admission[]>(`/admissions?patientId=${patientId}`);
  },
};
