'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAyurvedaDiagnosisCodeRequest,
  UpdateAyurvedaDiagnosisCodeResponse,
} from '@/app/api/v1/clinical-masters/ayurveda-diagnosis-codes/[id]/types';
import { ayurvedaDiagnosisCodesQueryKey } from './useAyurvedaDiagnosisCodes';

type UpdateAyurvedaDiagnosisCodeVariables = {
  id: number;
  request: UpdateAyurvedaDiagnosisCodeRequest;
};

async function updateAyurvedaDiagnosisCode({
  id,
  request,
}: UpdateAyurvedaDiagnosisCodeVariables): Promise<UpdateAyurvedaDiagnosisCodeResponse> {
  const response = await fetch(`/api/v1/clinical-masters/ayurveda-diagnosis-codes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Ayurveda Diagnosis Code');
  }

  return response.json() as Promise<UpdateAyurvedaDiagnosisCodeResponse>;
}

export function useUpdateAyurvedaDiagnosisCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAyurvedaDiagnosisCode,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ayurvedaDiagnosisCodesQueryKey });
    },
  });
}
