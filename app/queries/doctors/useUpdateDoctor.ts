'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SaveDoctorResponse, UpdateDoctorRequest } from '@/app/api/v1/doctors/[id]/types';
import { parseApiError } from '@/app/queries/api-error';
import { doctorQueryKey } from './useDoctor';
import { doctorsBaseKey } from './useDoctors';

type UpdateDoctorVariables = {
  id: number;
  request: UpdateDoctorRequest;
};

async function updateDoctor({ id, request }: UpdateDoctorVariables): Promise<SaveDoctorResponse> {
  const response = await fetch(`/api/v1/doctors/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Doctor');
  }

  return response.json() as Promise<SaveDoctorResponse>;
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDoctor,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: doctorsBaseKey });
      void queryClient.invalidateQueries({ queryKey: doctorQueryKey(variables.id) });
    },
  });
}
