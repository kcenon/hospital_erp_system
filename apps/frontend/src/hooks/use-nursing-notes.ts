import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nursingNoteApi } from '@/services';
import type { GetNursingNotesParams, CreateNursingNoteData } from '@/types';

export function useNursingNotes(admissionId: string, params: GetNursingNotesParams = {}) {
  return useQuery({
    queryKey: ['nursing-notes', admissionId, params],
    queryFn: () => nursingNoteApi.list(admissionId, params),
    enabled: !!admissionId,
  });
}

export function useSignificantNotes(admissionId: string) {
  return useQuery({
    queryKey: ['nursing-notes-significant', admissionId],
    queryFn: () => nursingNoteApi.getSignificant(admissionId),
    enabled: !!admissionId,
  });
}

export function useCreateNursingNote(admissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNursingNoteData) => nursingNoteApi.create(admissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nursing-notes', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['nursing-notes-significant', admissionId] });
    },
  });
}
