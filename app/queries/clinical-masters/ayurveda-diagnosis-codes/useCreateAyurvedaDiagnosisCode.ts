'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAyurvedaDiagnosisCodeRequest,
  SaveAyurvedaDiagnosisCodeResponse,
} from '@/app/api/v1/clinical-masters/ayurveda-diagnosis-codes/types';
import { ayurvedaDiagnosisCodesQueryKey } from './useAyurvedaDiagnosisCodes';

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

export function useCreateAyurvedaDiagnosisCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAyurvedaDiagnosisCode,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ayurvedaDiagnosisCodesQueryKey });
    },
  });
}
