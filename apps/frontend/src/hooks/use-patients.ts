import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientApi } from '@/services';
import type { FindPatientsParams, CreatePatientData } from '@/types';

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
