import { apiGet, apiPost } from '@/lib/api-client';
import type {
  DailyReport,
  DailySummary,
  PaginatedDailyReports,
  ListDailyReportsParams,
} from '@/types';

function buildQueryString(params: ListDailyReportsParams): string {
  const searchParams = new URLSearchParams();

  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export const dailyReportApi = {
  getReport: (admissionId: string, date: string): Promise<DailyReport | null> => {
    return apiGet<DailyReport | null>(`/admissions/${admissionId}/daily-reports/${date}`);
  },

  generateReport: (admissionId: string, date: string): Promise<DailyReport> => {
    return apiPost<DailyReport>(`/admissions/${admissionId}/daily-reports/${date}/generate`, {});
  },

  getSummary: (admissionId: string, date: string): Promise<DailySummary> => {
    return apiGet<DailySummary>(`/admissions/${admissionId}/daily-reports/${date}/summary`);
  },

  listReports: (
    admissionId: string,
    params: ListDailyReportsParams = {},
  ): Promise<PaginatedDailyReports> => {
    return apiGet<PaginatedDailyReports>(
      `/admissions/${admissionId}/daily-reports${buildQueryString(params)}`,
    );
  },
};
