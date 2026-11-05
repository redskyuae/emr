'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ActivateAyurvedaDiagnosisCodeResponse } from '@/app/api/v1/clinical-masters/ayurveda-diagnosis-codes/[id]/activate/types';
import type { DeactivateAyurvedaDiagnosisCodeResponse } from '@/app/api/v1/clinical-masters/ayurveda-diagnosis-codes/[id]/deactivate/types';
import { AYURVEDA_DIAGNOSIS_CODES_KEY } from './useAyurvedaDiagnosisCodes';

type SetAyurvedaDiagnosisCodeActiveResponse =
  ActivateAyurvedaDiagnosisCodeResponse | DeactivateAyurvedaDiagnosisCodeResponse;

type SetAyurvedaDiagnosisCodeActiveVariables = {
  id: number;
  isActive: boolean;
};

async function setAyurvedaDiagnosisCodeActive({
  id,
  isActive,
}: SetAyurvedaDiagnosisCodeActiveVariables): Promise<SetAyurvedaDiagnosisCodeActiveResponse> {
  const action = isActive ? 'activate' : 'deactivate';
  const response = await fetch(
    `/api/v1/clinical-masters/ayurveda-diagnosis-codes/${id}/${action}`,
    {
      method: 'POST',
      credentials: 'same-origin',
    }
  );

  if (!response.ok) {
    throw await parseApiError(response, `Could not ${action} Ayurveda Diagnosis Code`);
  }

  return response.json() as Promise<SetAyurvedaDiagnosisCodeActiveResponse>;
}

type UseSetAyurvedaDiagnosisCodeActiveOptions = Omit<
  UseMutationOptions<
    SetAyurvedaDiagnosisCodeActiveResponse,
    Error,
    SetAyurvedaDiagnosisCodeActiveVariables
  >,
  'mutationFn'
>;

export function useSetAyurvedaDiagnosisCodeActive(
  options?: UseSetAyurvedaDiagnosisCodeActiveOptions
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: setAyurvedaDiagnosisCodeActive,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: AYURVEDA_DIAGNOSIS_CODES_KEY });
      await onSuccess?.(...args);
    },
  });
}
