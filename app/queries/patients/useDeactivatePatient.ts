'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { patientsBaseKey } from '@/app/queries/patients/usePatients';
import type { DeactivatePatientResponse } from '@/app/api/v1/patients/[id]/deactivate/types';

async function deactivatePatient(patientId: number): Promise<DeactivatePatientResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}/deactivate`, {
    method: 'PATCH',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not deactivate Patient');
  }

  return response.json() as Promise<DeactivatePatientResponse>;
}

export function useDeactivatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivatePatient,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: patientsBaseKey });
    },
  });
}
