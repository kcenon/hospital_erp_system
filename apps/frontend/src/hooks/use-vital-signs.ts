import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vitalApi } from '@/services';
import type { GetVitalHistoryParams, GetTrendParams, RecordVitalSignsData } from '@/types';

export function useVitalHistory(admissionId: string, params: GetVitalHistoryParams = {}) {
  return useQuery({
    queryKey: ['vital-history', admissionId, params],
    queryFn: () => vitalApi.getHistory(admissionId, params),
    enabled: !!admissionId,
  });
}

export function useLatestVitalSign(admissionId: string) {
  return useQuery({
    queryKey: ['vital-latest', admissionId],
    queryFn: () => vitalApi.getLatest(admissionId),
    enabled: !!admissionId,
  });
}

export function useVitalTrend(admissionId: string, params: GetTrendParams | null) {
  return useQuery({
    queryKey: ['vital-trend', admissionId, params],
    queryFn: () => vitalApi.getTrend(admissionId, params!),
    enabled: !!admissionId && !!params,
  });
}

export function useRecordVitalSign(admissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordVitalSignsData) => vitalApi.record(admissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vital-history', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['vital-latest', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['vital-trend', admissionId] });
    },
  });
}
