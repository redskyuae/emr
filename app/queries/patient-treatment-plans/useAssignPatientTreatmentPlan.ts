'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  AssignPatientTreatmentPlanRequest,
  AssignPatientTreatmentPlanResponse,
} from '@/app/api/v1/patients/[id]/treatment-plans/assign/types';
import { parseApiError } from '@/app/queries/api-error';
import { patientTreatmentPlansBaseKey } from './usePatientTreatmentPlans';

type Assignment = { patientId: number; request: AssignPatientTreatmentPlanRequest };

async function assignPatientTreatmentPlan({
  patientId,
  request,
}: Assignment): Promise<AssignPatientTreatmentPlanResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/treatment-plans/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw await parseApiError(response, 'Could not assign Treatment Plan');
  }
  return response.json() as Promise<AssignPatientTreatmentPlanResponse>;
}

export function useAssignPatientTreatmentPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignPatientTreatmentPlan,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({
        queryKey: patientTreatmentPlansBaseKey(variables.patientId),
      });
    },
  });
}
