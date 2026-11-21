'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  UpdatePatientTreatmentPlanSessionRequest,
  UpdatePatientTreatmentPlanSessionResponse,
} from '@/app/api/v1/patients/[id]/treatment-plans/[planId]/sessions/[sessionId]/types';
import { parseApiError } from '@/app/queries/api-error';
import { patientTreatmentPlansBaseKey } from './usePatientTreatmentPlans';

type UpdatePatientTreatmentPlanSessionVariables = {
  patientId: number;
  planId: number;
  sessionId: number;
  request: UpdatePatientTreatmentPlanSessionRequest;
};

async function updatePatientTreatmentPlanSession({
  patientId,
  planId,
  sessionId,
  request,
}: UpdatePatientTreatmentPlanSessionVariables): Promise<UpdatePatientTreatmentPlanSessionResponse> {
  const response = await fetch(
    `/api/v1/patients/${patientId}/treatment-plans/${planId}/sessions/${sessionId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update the Session plan');
  }

  return response.json() as Promise<UpdatePatientTreatmentPlanSessionResponse>;
}

export function useUpdatePatientTreatmentPlanSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePatientTreatmentPlanSession,
    onSettled: (_data, _error, { patientId }) => {
      void queryClient.invalidateQueries({ queryKey: patientTreatmentPlansBaseKey(patientId) });
    },
  });
}
