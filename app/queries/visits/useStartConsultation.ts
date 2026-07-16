'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { StartVisitResponse } from '@/app/api/v1/visits/[id]/start/types';
import { visitQueryKey } from './useVisit';
import { VISITS_KEY } from './useVisits';

async function startConsultation(visitId: number): Promise<StartVisitResponse> {
  const response = await fetch(`/api/v1/visits/${visitId}/start`, {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not start the consultation');
  }

  return response.json() as Promise<StartVisitResponse>;
}

type UseStartConsultationOptions = Omit<
  UseMutationOptions<StartVisitResponse, Error, number>,
  'mutationFn'
>;

export function useStartConsultation(options?: UseStartConsultationOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: startConsultation,
    onSuccess: async (...args) => {
      const [, visitId] = args;
      await queryClient.invalidateQueries({ queryKey: VISITS_KEY });
      await queryClient.invalidateQueries({ queryKey: visitQueryKey(visitId) });
      await onSuccess?.(...args);
    },
  });
}
