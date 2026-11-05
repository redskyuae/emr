'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { AYURVEDA_DIAGNOSIS_CODES_KEY } from './useAyurvedaDiagnosisCodes';

async function deleteAyurvedaDiagnosisCode(id: number): Promise<void> {
  const response = await fetch(`/api/v1/clinical-masters/ayurveda-diagnosis-codes/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Ayurveda Diagnosis Code');
  }
}

type UseDeleteAyurvedaDiagnosisCodeOptions = Omit<
  UseMutationOptions<void, Error, number>,
  'mutationFn'
>;

export function useDeleteAyurvedaDiagnosisCode(options?: UseDeleteAyurvedaDiagnosisCodeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteAyurvedaDiagnosisCode,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: AYURVEDA_DIAGNOSIS_CODES_KEY });
      await onSuccess?.(...args);
    },
  });
}
