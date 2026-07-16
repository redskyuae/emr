'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdatePatientMedicationRequest,
  UpdatePatientMedicationResponse,
} from '@/app/api/v1/patients/[id]/medications/[medicationId]/types';
import { patientChartQueryKey } from './usePatientChart';

type UpdatePatientMedicationVariables = {
  patientId: number;
  medicationId: number;
  body: UpdatePatientMedicationRequest;
};

async function updatePatientMedication({
  patientId,
  medicationId,
  body,
}: UpdatePatientMedicationVariables): Promise<UpdatePatientMedicationResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/medications/${medicationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update the Medication');
  }

  return response.json() as Promise<UpdatePatientMedicationResponse>;
}

type UseUpdatePatientMedicationOptions = Omit<
  UseMutationOptions<UpdatePatientMedicationResponse, Error, UpdatePatientMedicationVariables>,
  'mutationFn'
>;

export function useUpdatePatientMedication(options?: UseUpdatePatientMedicationOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updatePatientMedication,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
