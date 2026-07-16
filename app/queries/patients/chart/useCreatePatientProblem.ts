'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SavePatientProblemRequest,
  SavePatientProblemResponse,
} from '@/app/api/v1/patients/[id]/problems/types';
import { patientChartQueryKey } from './usePatientChart';

type CreatePatientProblemVariables = {
  patientId: number;
  body: SavePatientProblemRequest;
};

async function createPatientProblem({
  patientId,
  body,
}: CreatePatientProblemVariables): Promise<SavePatientProblemResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/problems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not record the Problem');
  }

  return response.json() as Promise<SavePatientProblemResponse>;
}

type UseCreatePatientProblemOptions = Omit<
  UseMutationOptions<SavePatientProblemResponse, Error, CreatePatientProblemVariables>,
  'mutationFn'
>;

export function useCreatePatientProblem(options?: UseCreatePatientProblemOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createPatientProblem,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
