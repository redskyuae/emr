'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { patientsBaseKey } from '@/app/queries/patients/usePatients';
import type { ReactivatePatientResponse } from '@/app/api/v1/patients/[id]/reactivate/types';

async function reactivatePatient(patientId: number): Promise<ReactivatePatientResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/reactivate`, {
    method: 'PATCH',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not reactivate Patient');
  }

  return response.json() as Promise<ReactivatePatientResponse>;
}

export function useReactivatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivatePatient,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: patientsBaseKey });
    },
  });
}
