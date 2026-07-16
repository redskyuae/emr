'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SavePatientAllergyRequest,
  SavePatientAllergyResponse,
} from '@/app/api/v1/patients/[id]/allergies/types';
import { patientChartQueryKey } from './usePatientChart';

type CreatePatientAllergyVariables = {
  patientId: number;
  body: SavePatientAllergyRequest;
};

async function createPatientAllergy({
  patientId,
  body,
}: CreatePatientAllergyVariables): Promise<SavePatientAllergyResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/allergies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not record the Allergy');
  }

  return response.json() as Promise<SavePatientAllergyResponse>;
}

type UseCreatePatientAllergyOptions = Omit<
  UseMutationOptions<SavePatientAllergyResponse, Error, CreatePatientAllergyVariables>,
  'mutationFn'
>;

export function useCreatePatientAllergy(options?: UseCreatePatientAllergyOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createPatientAllergy,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
