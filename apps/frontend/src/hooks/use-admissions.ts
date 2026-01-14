import { useQuery } from '@tanstack/react-query';
import { admissionApi } from '@/services';

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
