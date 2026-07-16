'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { CompleteVisitResponse } from '@/app/api/v1/visits/[id]/complete/types';
import { visitQueryKey } from './useVisit';
import { VISITS_KEY } from './useVisits';

async function completeVisit(visitId: number): Promise<CompleteVisitResponse> {
  const response = await fetch(`/api/v1/visits/${visitId}/complete`, {
    method: 'POST',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not complete the Visit');
  }

  return response.json() as Promise<CompleteVisitResponse>;
}

type UseCompleteVisitOptions = Omit<
  UseMutationOptions<CompleteVisitResponse, Error, number>,
  'mutationFn'
>;

export function useCompleteVisit(options?: UseCompleteVisitOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: completeVisit,
    onSuccess: async (...args) => {
      const [, visitId] = args;
      await queryClient.invalidateQueries({ queryKey: VISITS_KEY });
      await queryClient.invalidateQueries({ queryKey: visitQueryKey(visitId) });
      await onSuccess?.(...args);
    },
  });
}
