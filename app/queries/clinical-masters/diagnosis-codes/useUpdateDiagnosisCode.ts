'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateDiagnosisCodeRequest,
  UpdateDiagnosisCodeResponse,
} from '@/app/api/v1/clinical-masters/diagnosis-codes/[id]/types';
import { DIAGNOSIS_CODES_KEY } from './useDiagnosisCodes';

type UpdateDiagnosisCodeVariables = {
  id: number;
  request: UpdateDiagnosisCodeRequest;
};

async function updateDiagnosisCode({
  id,
  request,
}: UpdateDiagnosisCodeVariables): Promise<UpdateDiagnosisCodeResponse> {
  const response = await fetch(`/api/v1/clinical-masters/diagnosis-codes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Diagnosis Code');
  }

  return response.json() as Promise<UpdateDiagnosisCodeResponse>;
}

type UseUpdateDiagnosisCodeOptions = Omit<
  UseMutationOptions<UpdateDiagnosisCodeResponse, Error, UpdateDiagnosisCodeVariables>,
  'mutationFn'
>;

export function useUpdateDiagnosisCode(options?: UseUpdateDiagnosisCodeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateDiagnosisCode,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: DIAGNOSIS_CODES_KEY });
      await onSuccess?.(...args);
    },
  });
}
