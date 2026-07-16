'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveClinicalNoteTypeRequest,
  SaveClinicalNoteTypeResponse,
} from '@/app/api/v1/clinical-masters/note-types/types';
import { CLINICAL_NOTE_TYPES_KEY } from './useClinicalNoteTypes';

async function createClinicalNoteType(
  request: SaveClinicalNoteTypeRequest
): Promise<SaveClinicalNoteTypeResponse> {
  const response = await fetch('/api/v1/clinical-masters/note-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Clinical Note Type');
  }

  return response.json() as Promise<SaveClinicalNoteTypeResponse>;
}

type UseCreateClinicalNoteTypeOptions = Omit<
  UseMutationOptions<SaveClinicalNoteTypeResponse, Error, SaveClinicalNoteTypeRequest>,
  'mutationFn'
>;

export function useCreateClinicalNoteType(options?: UseCreateClinicalNoteTypeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createClinicalNoteType,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: CLINICAL_NOTE_TYPES_KEY });
      await onSuccess?.(...args);
    },
  });
}
