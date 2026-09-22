'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SaveTherapistRequest, SaveTherapistResponse } from '@/app/api/v1/therapists/types';
import { parseApiError } from '@/app/queries/api-error';
import { therapistsBaseKey } from './useTherapists';

async function createTherapist(request: SaveTherapistRequest): Promise<SaveTherapistResponse> {
  const response = await fetch('/api/v1/therapists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });
  if (!response.ok) throw await parseApiError(response, 'Could not create Therapist');
  return response.json() as Promise<SaveTherapistResponse>;
}

export function useCreateTherapist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTherapist,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: therapistsBaseKey });
    },
  });
}
