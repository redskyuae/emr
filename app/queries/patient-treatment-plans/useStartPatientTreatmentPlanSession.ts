'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  StartPatientTreatmentPlanSessionRequest,
  StartPatientTreatmentPlanSessionResponse,
} from '@/app/api/v1/patients/[id]/treatment-plans/[planId]/sessions/[sessionId]/start/types';
import { parseApiError } from '@/app/queries/api-error';
import { patientTreatmentPlansBaseKey } from './usePatientTreatmentPlans';

type StartPatientTreatmentPlanSessionVariables = {
  patientId: number;
  planId: number;
  sessionId: number;
  request: StartPatientTreatmentPlanSessionRequest;
};

async function startPatientTreatmentPlanSession({
  patientId,
  planId,
  sessionId,
  request,
}: StartPatientTreatmentPlanSessionVariables): Promise<StartPatientTreatmentPlanSessionResponse> {
  const response = await fetch(
    `/api/v1/patients/${patientId}/treatment-plans/${planId}/sessions/${sessionId}/start`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    throw await parseApiError(response, 'Could not start the Session');
  }

  return response.json() as Promise<StartPatientTreatmentPlanSessionResponse>;
}

export function useStartPatientTreatmentPlanSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startPatientTreatmentPlanSession,
    onSettled: (_data, _error, { patientId }) => {
      void queryClient.invalidateQueries({ queryKey: patientTreatmentPlansBaseKey(patientId) });
    },
  });
}
