'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { SignClinicalNoteResponse } from '@/app/api/v1/patients/[id]/notes/[noteId]/sign/types';
import { patientChartQueryKey } from './usePatientChart';

type SignClinicalNoteVariables = {
  patientId: number;
  noteId: number;
};

async function signClinicalNote({
  patientId,
  noteId,
}: SignClinicalNoteVariables): Promise<SignClinicalNoteResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/notes/${noteId}/sign`, {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not sign the Clinical Note');
  }

  return response.json() as Promise<SignClinicalNoteResponse>;
}

type UseSignClinicalNoteOptions = Omit<
  UseMutationOptions<SignClinicalNoteResponse, Error, SignClinicalNoteVariables>,
  'mutationFn'
>;

export function useSignClinicalNote(options?: UseSignClinicalNoteOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: signClinicalNote,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
