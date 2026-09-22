'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeactivateTherapistResponse } from '@/app/api/v1/therapists/[id]/deactivate/types';
import { parseApiError } from '@/app/queries/api-error';
import { therapistQueryKey } from './useTherapist';
import { therapistsBaseKey } from './useTherapists';

async function deactivateTherapist(id: number): Promise<DeactivateTherapistResponse> {
  const response = await fetch(`/api/v1/therapists/${id}/deactivate`, {
    method: 'POST',
    credentials: 'same-origin',
  });
  if (!response.ok) throw await parseApiError(response, 'Could not deactivate Therapist');
  return response.json() as Promise<DeactivateTherapistResponse>;
}
export function useDeactivateTherapist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateTherapist,
    onSettled: (_d, _e, id) => {
      void queryClient.invalidateQueries({ queryKey: therapistsBaseKey });
      void queryClient.invalidateQueries({ queryKey: therapistQueryKey(id) });
    },
  });
}
