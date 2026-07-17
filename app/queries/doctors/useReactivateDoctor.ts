'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ReactivateDoctorResponse } from '@/app/api/v1/doctors/[id]/reactivate/types';
import { parseApiError } from '@/app/queries/api-error';
import { doctorQueryKey } from './useDoctor';
import { doctorsBaseKey } from './useDoctors';

async function reactivateDoctor(id: number): Promise<ReactivateDoctorResponse> {
  const response = await fetch(`/api/v1/doctors/${id}/reactivate`, {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not reactivate Doctor');
  }

  return response.json() as Promise<ReactivateDoctorResponse>;
}

export function useReactivateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reactivateDoctor,
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: doctorsBaseKey });
      void queryClient.invalidateQueries({ queryKey: doctorQueryKey(id) });
    },
  });
}
