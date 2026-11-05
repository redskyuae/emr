'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAyurvedaDiagnosisCodeRequest,
  SaveAyurvedaDiagnosisCodeResponse,
} from '@/app/api/v1/clinical-masters/ayurveda-diagnosis-codes/types';
import { AYURVEDA_DIAGNOSIS_CODES_KEY } from './useAyurvedaDiagnosisCodes';

async function createAyurvedaDiagnosisCode(
  request: SaveAyurvedaDiagnosisCodeRequest
): Promise<SaveAyurvedaDiagnosisCodeResponse> {
  const response = await fetch('/api/v1/clinical-masters/ayurveda-diagnosis-codes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Ayurveda Diagnosis Code');
  }

  return response.json() as Promise<SaveAyurvedaDiagnosisCodeResponse>;
}

type UseCreateAyurvedaDiagnosisCodeOptions = Omit<
  UseMutationOptions<SaveAyurvedaDiagnosisCodeResponse, Error, SaveAyurvedaDiagnosisCodeRequest>,
  'mutationFn'
>;

export function useCreateAyurvedaDiagnosisCode(options?: UseCreateAyurvedaDiagnosisCodeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createAyurvedaDiagnosisCode,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: AYURVEDA_DIAGNOSIS_CODES_KEY });
      await onSuccess?.(...args);
    },
  });
}
