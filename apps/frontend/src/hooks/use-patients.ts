import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '@/services';
import type { FindPatientsParams, CreatePatientData, CreatePatientDetailData } from '@/types';

export function usePatients(params: FindPatientsParams = {}) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientApi.findAll(params),
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientApi.findById(id),
    enabled: !!id,
  });
}

export function usePatientSearch(query: string) {
  return useQuery({
    queryKey: ['patient-search', query],
    queryFn: () => patientApi.search(query),
    enabled: query.length >= 2,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientData) => patientApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePatientData> }) =>
      patientApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', variables.id] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patientApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useCreatePatientDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, data }: { patientId: string; data: CreatePatientDetailData }) =>
      patientApi.createDetail(patientId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
    },
  });
}

export function useUpdatePatientDetail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      patientId,
      data,
    }: {
      patientId: string;
      data: Partial<CreatePatientDetailData>;
    }) => patientApi.updateDetail(patientId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
    },
  });
}
