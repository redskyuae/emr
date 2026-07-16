'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { DeletePatientMedicationResponse } from '@/app/api/v1/patients/[id]/medications/[medicationId]/types';
import { patientChartQueryKey } from './usePatientChart';

type DeletePatientMedicationVariables = {
  patientId: number;
  medicationId: number;
};

async function deletePatientMedication({
  patientId,
  medicationId,
}: DeletePatientMedicationVariables): Promise<DeletePatientMedicationResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/medications/${medicationId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete the Medication');
  }
}

type UseDeletePatientMedicationOptions = Omit<
  UseMutationOptions<DeletePatientMedicationResponse, Error, DeletePatientMedicationVariables>,
  'mutationFn'
>;

export function useDeletePatientMedication(options?: UseDeletePatientMedicationOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deletePatientMedication,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
