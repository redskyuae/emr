'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { DeletePatientProblemResponse } from '@/app/api/v1/patients/[id]/problems/[problemId]/types';
import { patientChartQueryKey } from './usePatientChart';

type DeletePatientProblemVariables = {
  patientId: number;
  problemId: number;
};

async function deletePatientProblem({
  patientId,
  problemId,
}: DeletePatientProblemVariables): Promise<DeletePatientProblemResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/problems/${problemId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete the Problem');
  }
}

type UseDeletePatientProblemOptions = Omit<
  UseMutationOptions<DeletePatientProblemResponse, Error, DeletePatientProblemVariables>,
  'mutationFn'
>;

export function useDeletePatientProblem(options?: UseDeletePatientProblemOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deletePatientProblem,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
