'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import type {
  AddPatientTreatmentPlanSessionsRequest,
  AddPatientTreatmentPlanSessionsResponse,
} from '@/app/api/v1/patients/[id]/treatment-plans/types';
import { parseApiError } from '@/app/queries/api-error';
import { patientTreatmentPlansBaseKey } from './usePatientTreatmentPlans';

type AddPatientTreatmentPlanSessionsVariables = {
  patientId: number;
  request: AddPatientTreatmentPlanSessionsRequest;
};

async function addPatientTreatmentPlanSessions({
  patientId,
  request,
}: AddPatientTreatmentPlanSessionsVariables): Promise<AddPatientTreatmentPlanSessionsResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/treatment-plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not add Patient Treatment Plan Sessions');
  }

  return response.json() as Promise<AddPatientTreatmentPlanSessionsResponse>;
}

type UseAddPatientTreatmentPlanSessionsOptions = Omit<
  UseMutationOptions<
    AddPatientTreatmentPlanSessionsResponse,
    Error,
    AddPatientTreatmentPlanSessionsVariables
  >,
  'mutationFn'
>;

export function useAddPatientTreatmentPlanSessions(
  options?: UseAddPatientTreatmentPlanSessionsOptions
) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: addPatientTreatmentPlanSessions,
    onSuccess: async (...args) => {
      const [, { patientId }] = args;
      await queryClient.invalidateQueries({ queryKey: patientTreatmentPlansBaseKey(patientId) });
      await onSuccess?.(...args);
    },
  });
}
