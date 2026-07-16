'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { DeleteClinicalNoteResponse } from '@/app/api/v1/patients/[id]/notes/[noteId]/types';
import { patientChartQueryKey } from './usePatientChart';

type DeleteClinicalNoteVariables = {
  patientId: number;
  noteId: number;
};

async function deleteClinicalNote({
  patientId,
  noteId,
}: DeleteClinicalNoteVariables): Promise<DeleteClinicalNoteResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/notes/${noteId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete the Clinical Note');
  }
}

type UseDeleteClinicalNoteOptions = Omit<
  UseMutationOptions<DeleteClinicalNoteResponse, Error, DeleteClinicalNoteVariables>,
  'mutationFn'
>;

export function useDeleteClinicalNote(options?: UseDeleteClinicalNoteOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteClinicalNote,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
