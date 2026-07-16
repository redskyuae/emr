'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { DeletePatientAllergyResponse } from '@/app/api/v1/patients/[id]/allergies/[allergyId]/types';
import { patientChartQueryKey } from './usePatientChart';

type DeletePatientAllergyVariables = {
  patientId: number;
  allergyId: number;
};

async function deletePatientAllergy({
  patientId,
  allergyId,
}: DeletePatientAllergyVariables): Promise<DeletePatientAllergyResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/allergies/${allergyId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete the Allergy');
  }
}

type UseDeletePatientAllergyOptions = Omit<
  UseMutationOptions<DeletePatientAllergyResponse, Error, DeletePatientAllergyVariables>,
  'mutationFn'
>;

export function useDeletePatientAllergy(options?: UseDeletePatientAllergyOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deletePatientAllergy,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
