'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdatePatientAllergyRequest,
  UpdatePatientAllergyResponse,
} from '@/app/api/v1/patients/[id]/allergies/[allergyId]/types';
import { patientChartQueryKey } from './usePatientChart';

type UpdatePatientAllergyVariables = {
  patientId: number;
  allergyId: number;
  body: UpdatePatientAllergyRequest;
};

async function updatePatientAllergy({
  patientId,
  allergyId,
  body,
}: UpdatePatientAllergyVariables): Promise<UpdatePatientAllergyResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/allergies/${allergyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update the Allergy');
  }

  return response.json() as Promise<UpdatePatientAllergyResponse>;
}

type UseUpdatePatientAllergyOptions = Omit<
  UseMutationOptions<UpdatePatientAllergyResponse, Error, UpdatePatientAllergyVariables>,
  'mutationFn'
>;

export function useUpdatePatientAllergy(options?: UseUpdatePatientAllergyOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updatePatientAllergy,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
