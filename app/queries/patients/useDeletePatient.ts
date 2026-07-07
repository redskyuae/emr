'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { patientsBaseKey } from '@/app/queries/patients/usePatients';
import type { DeletePatientResponse } from '@/app/api/v1/patients/[id]/types';

async function deletePatient(patientId: number): Promise<DeletePatientResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Patient');
  }
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePatient,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: patientsBaseKey });
    },
  });
}
