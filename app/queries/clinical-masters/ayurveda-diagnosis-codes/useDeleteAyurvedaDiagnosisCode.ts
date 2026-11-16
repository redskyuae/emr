'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { DeleteAyurvedaDiagnosisCodeResponse } from '@/app/api/v1/clinical-masters/ayurveda-diagnosis-codes/[id]/types';
import { ayurvedaDiagnosisCodesQueryKey } from './useAyurvedaDiagnosisCodes';

async function deleteAyurvedaDiagnosisCode(
  id: number
): Promise<DeleteAyurvedaDiagnosisCodeResponse> {
  const response = await fetch(`/api/v1/clinical-masters/ayurveda-diagnosis-codes/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Ayurveda Diagnosis Code');
  }
}

export function useDeleteAyurvedaDiagnosisCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAyurvedaDiagnosisCode,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ayurvedaDiagnosisCodesQueryKey });
    },
  });
}
