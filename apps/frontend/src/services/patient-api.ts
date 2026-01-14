import { apiGet } from '@/lib/api-client';
import type { Patient, PaginatedPatients, FindPatientsParams } from '@/types';

function buildQueryString(params: FindPatientsParams): string {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set('search', params.search);
  if (params.name) searchParams.set('name', params.name);
  if (params.patientNumber) searchParams.set('patientNumber', params.patientNumber);
  if (params.gender) searchParams.set('gender', params.gender);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const patientApi = {
  findAll: (params: FindPatientsParams = {}): Promise<PaginatedPatients> => {
    return apiGet<PaginatedPatients>(`/patients${buildQueryString(params)}`);
  },

  findById: (id: string): Promise<Patient> => {
    return apiGet<Patient>(`/patients/${id}`);
  },

  findByPatientNumber: (patientNumber: string): Promise<Patient> => {
    return apiGet<Patient>(`/patients/by-number/${patientNumber}`);
  },

  search: (query: string): Promise<Patient[]> => {
    return apiGet<Patient[]>(`/patients/search?q=${encodeURIComponent(query)}`);
  },
};
