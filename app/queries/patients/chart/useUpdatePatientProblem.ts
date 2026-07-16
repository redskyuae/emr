'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdatePatientProblemRequest,
  UpdatePatientProblemResponse,
} from '@/app/api/v1/patients/[id]/problems/[problemId]/types';
import { patientChartQueryKey } from './usePatientChart';

type UpdatePatientProblemVariables = {
  patientId: number;
  problemId: number;
  body: UpdatePatientProblemRequest;
};

async function updatePatientProblem({
  patientId,
  problemId,
  body,
}: UpdatePatientProblemVariables): Promise<UpdatePatientProblemResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/problems/${problemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update the Problem');
  }

  return response.json() as Promise<UpdatePatientProblemResponse>;
}

type UseUpdatePatientProblemOptions = Omit<
  UseMutationOptions<UpdatePatientProblemResponse, Error, UpdatePatientProblemVariables>,
  'mutationFn'
>;

export function useUpdatePatientProblem(options?: UseUpdatePatientProblemOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updatePatientProblem,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
