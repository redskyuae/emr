'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  UpdateTherapistRequest,
  UpdateTherapistResponse,
} from '@/app/api/v1/therapists/[id]/types';
import { parseApiError } from '@/app/queries/api-error';
import { therapistQueryKey } from './useTherapist';
import { therapistsBaseKey } from './useTherapists';

type Variables = { id: number; request: UpdateTherapistRequest };
async function updateTherapist({ id, request }: Variables): Promise<UpdateTherapistResponse> {
  const response = await fetch(`/api/v1/therapists/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });
  if (!response.ok) throw await parseApiError(response, 'Could not update Therapist');
  return response.json() as Promise<UpdateTherapistResponse>;
}

export function useUpdateTherapist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTherapist,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: therapistsBaseKey });
      void queryClient.invalidateQueries({ queryKey: therapistQueryKey(variables.id) });
    },
  });
}
