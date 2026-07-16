'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateClinicalNoteRequest,
  UpdateClinicalNoteResponse,
} from '@/app/api/v1/patients/[id]/notes/[noteId]/types';
import { patientChartQueryKey } from './usePatientChart';

type UpdateClinicalNoteVariables = {
  patientId: number;
  noteId: number;
  body: UpdateClinicalNoteRequest;
};

async function updateClinicalNote({
  patientId,
  noteId,
  body,
}: UpdateClinicalNoteVariables): Promise<UpdateClinicalNoteResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/notes/${noteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update the Clinical Note');
  }

  return response.json() as Promise<UpdateClinicalNoteResponse>;
}

type UseUpdateClinicalNoteOptions = Omit<
  UseMutationOptions<UpdateClinicalNoteResponse, Error, UpdateClinicalNoteVariables>,
  'mutationFn'
>;

export function useUpdateClinicalNote(options?: UseUpdateClinicalNoteOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateClinicalNote,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
