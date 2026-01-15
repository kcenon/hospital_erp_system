import { apiGet, apiPost } from '@/lib/api-client';
import type {
  VitalSign,
  PaginatedVitalSigns,
  VitalTrend,
  RecordVitalSignsData,
  GetVitalHistoryParams,
  GetTrendParams,
} from '@/types';

function buildHistoryQueryString(params: GetVitalHistoryParams): string {
  const searchParams = new URLSearchParams();

  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.hasAlert !== undefined) searchParams.set('hasAlert', String(params.hasAlert));
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

function buildTrendQueryString(params: GetTrendParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  return `?${searchParams.toString()}`;
}

export const vitalApi = {
  record: (admissionId: string, data: RecordVitalSignsData): Promise<VitalSign> => {
    return apiPost<VitalSign>(`/admissions/${admissionId}/vitals`, data);
  },

  getHistory: (
    admissionId: string,
    params: GetVitalHistoryParams = {},
  ): Promise<PaginatedVitalSigns> => {
    return apiGet<PaginatedVitalSigns>(
      `/admissions/${admissionId}/vitals${buildHistoryQueryString(params)}`,
    );
  },

  getLatest: (admissionId: string): Promise<VitalSign | null> => {
    return apiGet<VitalSign | null>(`/admissions/${admissionId}/vitals/latest`);
  },

  getTrend: (admissionId: string, params: GetTrendParams): Promise<VitalTrend> => {
    return apiGet<VitalTrend>(
      `/admissions/${admissionId}/vitals/trend${buildTrendQueryString(params)}`,
    );
  },
};
