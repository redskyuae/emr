'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { DeletePatientVitalSignResponse } from '@/app/api/v1/patients/[id]/vitals/[vitalId]/types';
import { patientChartQueryKey } from './usePatientChart';

type DeletePatientVitalSignVariables = {
  patientId: number;
  vitalId: number;
};

async function deletePatientVitalSign({
  patientId,
  vitalId,
}: DeletePatientVitalSignVariables): Promise<DeletePatientVitalSignResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/vitals/${vitalId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete the Vital Signs');
  }
}

type UseDeletePatientVitalSignOptions = Omit<
  UseMutationOptions<DeletePatientVitalSignResponse, Error, DeletePatientVitalSignVariables>,
  'mutationFn'
>;

export function useDeletePatientVitalSign(options?: UseDeletePatientVitalSignOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deletePatientVitalSign,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
