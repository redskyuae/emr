'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SaveDoctorRequest, SaveDoctorResponse } from '@/app/api/v1/doctors/types';
import { parseApiError } from '@/app/queries/api-error';
import { doctorsBaseKey } from './useDoctors';

async function createDoctor(request: SaveDoctorRequest): Promise<SaveDoctorResponse> {
  const response = await fetch('/api/v1/doctors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Doctor');
  }

  return response.json() as Promise<SaveDoctorResponse>;
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDoctor,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: doctorsBaseKey });
    },
  });
}
