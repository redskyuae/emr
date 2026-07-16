'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveDiagnosisCodeRequest,
  SaveDiagnosisCodeResponse,
} from '@/app/api/v1/clinical-masters/diagnosis-codes/types';
import { DIAGNOSIS_CODES_KEY } from './useDiagnosisCodes';

async function createDiagnosisCode(
  request: SaveDiagnosisCodeRequest
): Promise<SaveDiagnosisCodeResponse> {
  const response = await fetch('/api/v1/clinical-masters/diagnosis-codes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Diagnosis Code');
  }

  return response.json() as Promise<SaveDiagnosisCodeResponse>;
}

type UseCreateDiagnosisCodeOptions = Omit<
  UseMutationOptions<SaveDiagnosisCodeResponse, Error, SaveDiagnosisCodeRequest>,
  'mutationFn'
>;

export function useCreateDiagnosisCode(options?: UseCreateDiagnosisCodeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createDiagnosisCode,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: DIAGNOSIS_CODES_KEY });
      await onSuccess?.(...args);
    },
  });
}
