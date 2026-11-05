'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ActivateDiagnosisCodeResponse } from '@/app/api/v1/clinical-masters/diagnosis-codes/[id]/activate/types';
import type { DeactivateDiagnosisCodeResponse } from '@/app/api/v1/clinical-masters/diagnosis-codes/[id]/deactivate/types';
import { DIAGNOSIS_CODES_KEY } from './useDiagnosisCodes';

type SetDiagnosisCodeActiveResponse =
  ActivateDiagnosisCodeResponse | DeactivateDiagnosisCodeResponse;

type SetDiagnosisCodeActiveVariables = {
  id: number;
  isActive: boolean;
};

async function setDiagnosisCodeActive({
  id,
  isActive,
}: SetDiagnosisCodeActiveVariables): Promise<SetDiagnosisCodeActiveResponse> {
  const action = isActive ? 'activate' : 'deactivate';
  const response = await fetch(`/api/v1/clinical-masters/diagnosis-codes/${id}/${action}`, {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, `Could not ${action} Diagnosis Code`);
  }

  return response.json() as Promise<SetDiagnosisCodeActiveResponse>;
}

type UseSetDiagnosisCodeActiveOptions = Omit<
  UseMutationOptions<SetDiagnosisCodeActiveResponse, Error, SetDiagnosisCodeActiveVariables>,
  'mutationFn'
>;

export function useSetDiagnosisCodeActive(options?: UseSetDiagnosisCodeActiveOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: setDiagnosisCodeActive,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: DIAGNOSIS_CODES_KEY });
      await onSuccess?.(...args);
    },
  });
}
