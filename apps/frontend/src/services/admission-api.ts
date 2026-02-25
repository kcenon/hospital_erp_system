import { apiGet, apiPost } from '@/lib/api-client';
import type {
  Admission,
  PaginatedAdmissions,
  CreateAdmissionData,
  TransferData,
  Transfer,
  DischargeData,
  Discharge,
} from '@/types';

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

  findByPatientId: async (patientId: string): Promise<Admission[]> => {
    const response = await apiGet<PaginatedAdmissions>(
      `/admissions?patientId=${patientId}&limit=100`,
    );
    return response.data;
  },

  findActiveByPatientId: (patientId: string): Promise<Admission | null> => {
    return apiGet<Admission | null>(`/admissions/patient/${patientId}/active`);
  },

  create: (data: CreateAdmissionData): Promise<Admission> => {
    return apiPost<Admission>('/admissions', data);
  },

  transfer: (admissionId: string, data: TransferData): Promise<Transfer> => {
    return apiPost<Transfer>(`/admissions/${admissionId}/transfer`, data);
  },

  discharge: (admissionId: string, data: DischargeData): Promise<Discharge> => {
    return apiPost<Discharge>(`/admissions/${admissionId}/discharge`, data);
  },

  getTransfers: (admissionId: string): Promise<Transfer[]> => {
    return apiGet<Transfer[]>(`/admissions/${admissionId}/transfers`);
  },
};
