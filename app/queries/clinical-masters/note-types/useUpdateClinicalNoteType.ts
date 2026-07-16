'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateClinicalNoteTypeRequest,
  UpdateClinicalNoteTypeResponse,
} from '@/app/api/v1/clinical-masters/note-types/[id]/types';
import { CLINICAL_NOTE_TYPES_KEY } from './useClinicalNoteTypes';

type UpdateClinicalNoteTypeVariables = {
  id: number;
  request: UpdateClinicalNoteTypeRequest;
};

async function updateClinicalNoteType({
  id,
  request,
}: UpdateClinicalNoteTypeVariables): Promise<UpdateClinicalNoteTypeResponse> {
  const response = await fetch(`/api/v1/clinical-masters/note-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Clinical Note Type');
  }

  return response.json() as Promise<UpdateClinicalNoteTypeResponse>;
}

type UseUpdateClinicalNoteTypeOptions = Omit<
  UseMutationOptions<UpdateClinicalNoteTypeResponse, Error, UpdateClinicalNoteTypeVariables>,
  'mutationFn'
>;

export function useUpdateClinicalNoteType(options?: UseUpdateClinicalNoteTypeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateClinicalNoteType,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: CLINICAL_NOTE_TYPES_KEY });
      await onSuccess?.(...args);
    },
  });
}
