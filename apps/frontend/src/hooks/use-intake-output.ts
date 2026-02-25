import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intakeOutputApi } from '@/services';
import type { GetIOHistoryParams, RecordIOData } from '@/types';

export function useIOHistory(admissionId: string, params: GetIOHistoryParams = {}) {
  return useQuery({
    queryKey: ['io-history', admissionId, params],
    queryFn: () => intakeOutputApi.getHistory(admissionId, params),
    enabled: !!admissionId,
  });
}

export function useIODailySummary(admissionId: string, date: string) {
  return useQuery({
    queryKey: ['io-daily-summary', admissionId, date],
    queryFn: () => intakeOutputApi.getDailySummary(admissionId, date),
    enabled: !!admissionId && !!date,
  });
}

export function useRecordIO(admissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordIOData) => intakeOutputApi.record(admissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['io-history', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['io-daily-summary', admissionId] });
    },
  });
}
