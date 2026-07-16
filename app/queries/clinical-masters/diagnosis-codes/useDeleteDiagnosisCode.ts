'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { DIAGNOSIS_CODES_KEY } from './useDiagnosisCodes';

async function deleteDiagnosisCode(id: number): Promise<void> {
  const response = await fetch(`/api/v1/clinical-masters/diagnosis-codes/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Diagnosis Code');
  }
}

type UseDeleteDiagnosisCodeOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteDiagnosisCode(options?: UseDeleteDiagnosisCodeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteDiagnosisCode,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: DIAGNOSIS_CODES_KEY });
      await onSuccess?.(...args);
    },
  });
}
