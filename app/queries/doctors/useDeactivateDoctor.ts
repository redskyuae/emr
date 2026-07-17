'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { DeactivateDoctorResponse } from '@/app/api/v1/doctors/[id]/deactivate/types';
import { parseApiError } from '@/app/queries/api-error';
import { doctorQueryKey } from './useDoctor';
import { doctorsBaseKey } from './useDoctors';

async function deactivateDoctor(id: number): Promise<DeactivateDoctorResponse> {
  const response = await fetch(`/api/v1/doctors/${id}/deactivate`, {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not deactivate Doctor');
  }

  return response.json() as Promise<DeactivateDoctorResponse>;
}

export function useDeactivateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateDoctor,
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: doctorsBaseKey });
      void queryClient.invalidateQueries({ queryKey: doctorQueryKey(id) });
    },
  });
}
