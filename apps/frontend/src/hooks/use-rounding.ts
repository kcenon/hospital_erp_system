import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roundingApi } from '@/services';
import type {
  FindRoundsParams,
  CreateRoundData,
  CreateRoundRecordData,
  UpdateRoundRecordData,
} from '@/types';

// Query keys
export const roundingKeys = {
  all: ['rounds'] as const,
  lists: () => [...roundingKeys.all, 'list'] as const,
  list: (params: FindRoundsParams) => [...roundingKeys.lists(), params] as const,
  details: () => [...roundingKeys.all, 'detail'] as const,
  detail: (id: string) => [...roundingKeys.details(), id] as const,
  patients: (roundId: string) => [...roundingKeys.all, 'patients', roundId] as const,
  records: (roundId: string) => [...roundingKeys.all, 'records', roundId] as const,
};

// Query hooks
export function useRounds(params: FindRoundsParams = {}) {
  return useQuery({
    queryKey: roundingKeys.list(params),
    queryFn: () => roundingApi.findAll(params),
  });
}

export function useRound(id: string) {
  return useQuery({
    queryKey: roundingKeys.detail(id),
    queryFn: () => roundingApi.findById(id),
    enabled: !!id,
  });
}

export function useRoundByNumber(roundNumber: string) {
  return useQuery({
    queryKey: ['rounds', 'by-number', roundNumber],
    queryFn: () => roundingApi.findByRoundNumber(roundNumber),
    enabled: !!roundNumber,
  });
}

export function useRoundingPatients(roundId: string) {
  return useQuery({
    queryKey: roundingKeys.patients(roundId),
    queryFn: () => roundingApi.getPatientList(roundId),
    enabled: !!roundId,
  });
}

export function useRoundRecords(roundId: string) {
  return useQuery({
    queryKey: roundingKeys.records(roundId),
    queryFn: () => roundingApi.getRecords(roundId),
    enabled: !!roundId,
  });
}

// Mutation hooks
export function useCreateRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoundData) => roundingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roundingKeys.lists() });
    },
  });
}

export function useStartRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roundingApi.start(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roundingKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: roundingKeys.lists() });
    },
  });
}

export function usePauseRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roundingApi.pause(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roundingKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: roundingKeys.lists() });
    },
  });
}

export function useResumeRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roundingApi.resume(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roundingKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: roundingKeys.lists() });
    },
  });
}

export function useCompleteRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roundingApi.complete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roundingKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: roundingKeys.lists() });
    },
  });
}

export function useCancelRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roundingApi.cancel(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roundingKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: roundingKeys.lists() });
    },
  });
}

export function useAddRoundRecord(roundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoundRecordData) => roundingApi.addRecord(roundId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roundingKeys.detail(roundId) });
      queryClient.invalidateQueries({ queryKey: roundingKeys.patients(roundId) });
      queryClient.invalidateQueries({ queryKey: roundingKeys.records(roundId) });
    },
  });
}

export function useUpdateRoundRecord(roundId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recordId, data }: { recordId: string; data: UpdateRoundRecordData }) =>
      roundingApi.updateRecord(roundId, recordId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roundingKeys.detail(roundId) });
      queryClient.invalidateQueries({ queryKey: roundingKeys.patients(roundId) });
      queryClient.invalidateQueries({ queryKey: roundingKeys.records(roundId) });
    },
  });
}
