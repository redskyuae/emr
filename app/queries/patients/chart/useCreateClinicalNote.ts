'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveClinicalNoteRequest,
  SaveClinicalNoteResponse,
} from '@/app/api/v1/patients/[id]/notes/types';
import { patientChartQueryKey } from './usePatientChart';

type CreateClinicalNoteVariables = {
  patientId: number;
  body: SaveClinicalNoteRequest;
};

async function createClinicalNote({
  patientId,
  body,
}: CreateClinicalNoteVariables): Promise<SaveClinicalNoteResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create the Clinical Note');
  }

  return response.json() as Promise<SaveClinicalNoteResponse>;
}

type UseCreateClinicalNoteOptions = Omit<
  UseMutationOptions<SaveClinicalNoteResponse, Error, CreateClinicalNoteVariables>,
  'mutationFn'
>;

export function useCreateClinicalNote(options?: UseCreateClinicalNoteOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createClinicalNote,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
