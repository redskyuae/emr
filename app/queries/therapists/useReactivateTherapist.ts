'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactivateTherapistResponse } from '@/app/api/v1/therapists/[id]/reactivate/types';
import { parseApiError } from '@/app/queries/api-error';
import { therapistQueryKey } from './useTherapist';
import { therapistsBaseKey } from './useTherapists';

async function reactivateTherapist(id: number): Promise<ReactivateTherapistResponse> {
  const response = await fetch(`/api/v1/therapists/${id}/reactivate`, {
    method: 'POST',
    credentials: 'same-origin',
  });
  if (!response.ok) throw await parseApiError(response, 'Could not reactivate Therapist');
  return response.json() as Promise<ReactivateTherapistResponse>;
}
export function useReactivateTherapist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reactivateTherapist,
    onSettled: (_d, _e, id) => {
      void queryClient.invalidateQueries({ queryKey: therapistsBaseKey });
      void queryClient.invalidateQueries({ queryKey: therapistQueryKey(id) });
    },
  });
}
