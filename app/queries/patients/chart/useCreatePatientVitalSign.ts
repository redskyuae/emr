'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SavePatientVitalSignRequest,
  SavePatientVitalSignResponse,
} from '@/app/api/v1/patients/[id]/vitals/types';
import { patientChartQueryKey } from './usePatientChart';

type CreatePatientVitalSignVariables = {
  patientId: number;
  body: SavePatientVitalSignRequest;
};

async function createPatientVitalSign({
  patientId,
  body,
}: CreatePatientVitalSignVariables): Promise<SavePatientVitalSignResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/vitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not record the Vital Signs');
  }

  return response.json() as Promise<SavePatientVitalSignResponse>;
}

type UseCreatePatientVitalSignOptions = Omit<
  UseMutationOptions<SavePatientVitalSignResponse, Error, CreatePatientVitalSignVariables>,
  'mutationFn'
>;

export function useCreatePatientVitalSign(options?: UseCreatePatientVitalSignOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createPatientVitalSign,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: patientChartQueryKey(args[1].patientId),
      });
      await onSuccess?.(...args);
    },
  });
}
