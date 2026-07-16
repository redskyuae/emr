'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { CLINICAL_NOTE_TYPES_KEY } from './useClinicalNoteTypes';

async function deleteClinicalNoteType(id: number): Promise<void> {
  const response = await fetch(`/api/v1/clinical-masters/note-types/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Clinical Note Type');
  }
}

type UseDeleteClinicalNoteTypeOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteClinicalNoteType(options?: UseDeleteClinicalNoteTypeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteClinicalNoteType,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: CLINICAL_NOTE_TYPES_KEY });
      await onSuccess?.(...args);
    },
  });
}
