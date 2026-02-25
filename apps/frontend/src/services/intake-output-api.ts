import { apiGet, apiPost } from '@/lib/api-client';
import type {
  IntakeOutput,
  PaginatedIntakeOutput,
  RecordIOData,
  GetIOHistoryParams,
  IODailySummary,
} from '@/types';

function buildHistoryQueryString(params: GetIOHistoryParams): string {
  const searchParams = new URLSearchParams();

  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const intakeOutputApi = {
  record: (admissionId: string, data: RecordIOData): Promise<IntakeOutput> => {
    return apiPost<IntakeOutput>(`/admissions/${admissionId}/io`, data);
  },

  getHistory: (
    admissionId: string,
    params: GetIOHistoryParams = {},
  ): Promise<PaginatedIntakeOutput> => {
    return apiGet<PaginatedIntakeOutput>(
      `/admissions/${admissionId}/io${buildHistoryQueryString(params)}`,
    );
  },

  getDailySummary: (admissionId: string, date: string): Promise<IODailySummary | null> => {
    return apiGet<IODailySummary | null>(`/admissions/${admissionId}/io/daily/${date}`);
  },
};
