'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAyurvedaDiagnosisCodeRequest,
  UpdateAyurvedaDiagnosisCodeResponse,
} from '@/app/api/v1/clinical-masters/ayurveda-diagnosis-codes/[id]/types';
import { AYURVEDA_DIAGNOSIS_CODES_KEY } from './useAyurvedaDiagnosisCodes';

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

type UseUpdateAyurvedaDiagnosisCodeOptions = Omit<
  UseMutationOptions<
    UpdateAyurvedaDiagnosisCodeResponse,
    Error,
    UpdateAyurvedaDiagnosisCodeVariables
  >,
  'mutationFn'
>;

export function useUpdateAyurvedaDiagnosisCode(options?: UseUpdateAyurvedaDiagnosisCodeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateAyurvedaDiagnosisCode,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: AYURVEDA_DIAGNOSIS_CODES_KEY });
      await onSuccess?.(...args);
    },
  });
}
