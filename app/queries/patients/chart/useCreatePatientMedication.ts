'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SavePatientMedicationRequest,
  SavePatientMedicationResponse,
} from '@/app/api/v1/patients/[id]/medications/types';
import { patientChartQueryKey } from './usePatientChart';

type CreatePatientMedicationVariables = {
  patientId: number;
  body: SavePatientMedicationRequest;
};

async function createPatientMedication({
  patientId,
  body,
}: CreatePatientMedicationVariables): Promise<SavePatientMedicationResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/medications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not record the Medication');
  }

  return response.json() as Promise<SavePatientMedicationResponse>;
}

type UseCreatePatientMedicationOptions = Omit<
  UseMutationOptions<SavePatientMedicationResponse, Error, CreatePatientMedicationVariables>,
  'mutationFn'
>;

export function useCreatePatientMedication(options?: UseCreatePatientMedicationOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createPatientMedication,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
