import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyReportApi } from '@/services';
import type { ListDailyReportsParams } from '@/types';

export function useDailyReport(admissionId: string, date: string) {
  return useQuery({
    queryKey: ['daily-report', admissionId, date],
    queryFn: () => dailyReportApi.getReport(admissionId, date),
    enabled: !!admissionId && !!date,
  });
}

export function useDailySummary(admissionId: string, date: string) {
  return useQuery({
    queryKey: ['daily-summary', admissionId, date],
    queryFn: () => dailyReportApi.getSummary(admissionId, date),
    enabled: !!admissionId && !!date,
  });
}

export function useDailyReportList(admissionId: string, params: ListDailyReportsParams = {}) {
  return useQuery({
    queryKey: ['daily-reports', admissionId, params],
    queryFn: () => dailyReportApi.listReports(admissionId, params),
    enabled: !!admissionId,
  });
}

export function useGenerateDailyReport(admissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (date: string) => dailyReportApi.generateReport(admissionId, date),
    onSuccess: (_data, date) => {
      queryClient.invalidateQueries({ queryKey: ['daily-report', admissionId, date] });
      queryClient.invalidateQueries({ queryKey: ['daily-reports', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary', admissionId, date] });
    },
  });
}
