'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { patientsBaseKey } from '@/app/queries/patients/usePatients';
import type { SavePatientRequest, SavePatientResponse } from '@/app/api/v1/patients/types';

async function registerPatient(request: SavePatientRequest): Promise<SavePatientResponse> {
  const response = await fetch('/api/v1/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not register Patient');
  }

  return response.json() as Promise<SavePatientResponse>;
}

export function useRegisterPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerPatient,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: patientsBaseKey });
    },
  });
}
