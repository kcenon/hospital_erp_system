import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicationApi } from '@/services';
import type {
  GetMedicationHistoryParams,
  ScheduleMedicationData,
  AdministerMedicationData,
} from '@/types';

export function useMedicationHistory(admissionId: string, params: GetMedicationHistoryParams = {}) {
  return useQuery({
    queryKey: ['medication-history', admissionId, params],
    queryFn: () => medicationApi.getHistory(admissionId, params),
    enabled: !!admissionId,
  });
}

export function useScheduledMedications(admissionId: string, date: string) {
  return useQuery({
    queryKey: ['medication-scheduled', admissionId, date],
    queryFn: () => medicationApi.getScheduled(admissionId, date),
    enabled: !!admissionId && !!date,
  });
}

export function useScheduleMedication(admissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduleMedicationData) => medicationApi.schedule(admissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-history', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['medication-scheduled', admissionId] });
    },
  });
}

export function useAdministerMedication(admissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      medicationId,
      data,
    }: {
      medicationId: string;
      data?: AdministerMedicationData;
    }) => medicationApi.administer(admissionId, medicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-history', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['medication-scheduled', admissionId] });
    },
  });
}

export function useHoldMedication(admissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ medicationId, reason }: { medicationId: string; reason: string }) =>
      medicationApi.hold(admissionId, medicationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-history', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['medication-scheduled', admissionId] });
    },
  });
}

export function useRefuseMedication(admissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ medicationId, reason }: { medicationId: string; reason: string }) =>
      medicationApi.refuse(admissionId, medicationId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication-history', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['medication-scheduled', admissionId] });
    },
  });
}
