'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { patientsBaseKey } from '@/app/queries/patients/usePatients';
import type { UpdatePatientRequest, UpdatePatientResponse } from '@/app/api/v1/patients/[id]/types';

type UpdatePatientVariables = {
  patientId: number;
  request: UpdatePatientRequest;
};

async function updatePatient({
  patientId,
  request,
}: UpdatePatientVariables): Promise<UpdatePatientResponse> {
  const response = await fetch(`/api/v1/patients/${patientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Patient');
  }

  return response.json() as Promise<UpdatePatientResponse>;
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePatient,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: patientsBaseKey });
    },
  });
}
