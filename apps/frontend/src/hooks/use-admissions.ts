import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { admissionApi } from '@/services';
import type { CreateAdmissionData, TransferData, DischargeData } from '@/types';

export function usePatientAdmissions(patientId: string) {
  return useQuery({
    queryKey: ['admissions', 'patient', patientId],
    queryFn: () => admissionApi.findByPatientId(patientId),
    enabled: !!patientId,
  });
}

export function useAdmission(id: string) {
  return useQuery({
    queryKey: ['admission', id],
    queryFn: () => admissionApi.findById(id),
    enabled: !!id,
  });
}

export function useCreateAdmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdmissionData) => admissionApi.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['admissions', 'patient', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['available-beds'] });
      queryClient.invalidateQueries({ queryKey: ['floor-dashboard'] });
    },
  });
}

export function useTransferPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ admissionId, data }: { admissionId: string; data: TransferData }) =>
      admissionApi.transfer(admissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['available-beds'] });
      queryClient.invalidateQueries({ queryKey: ['floor-dashboard'] });
    },
  });
}

export function useDischargePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ admissionId, data }: { admissionId: string; data: DischargeData }) =>
      admissionApi.discharge(admissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['available-beds'] });
      queryClient.invalidateQueries({ queryKey: ['floor-dashboard'] });
    },
  });
}
