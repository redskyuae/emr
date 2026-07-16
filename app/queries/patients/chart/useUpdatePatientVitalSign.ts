'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdatePatientVitalSignRequest,
  UpdatePatientVitalSignResponse,
} from '@/app/api/v1/patients/[id]/vitals/[vitalId]/types';
import { patientChartQueryKey } from './usePatientChart';

type UpdatePatientVitalSignVariables = {
  patientId: number;
  vitalId: number;
  body: UpdatePatientVitalSignRequest;
};

async function updatePatientVitalSign({
  patientId,
  vitalId,
  body,
}: UpdatePatientVitalSignVariables): Promise<UpdatePatientVitalSignResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/vitals/${vitalId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update the Vital Signs');
  }

  return response.json() as Promise<UpdatePatientVitalSignResponse>;
}

type UseUpdatePatientVitalSignOptions = Omit<
  UseMutationOptions<UpdatePatientVitalSignResponse, Error, UpdatePatientVitalSignVariables>,
  'mutationFn'
>;

export function useUpdatePatientVitalSign(options?: UseUpdatePatientVitalSignOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updatePatientVitalSign,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
