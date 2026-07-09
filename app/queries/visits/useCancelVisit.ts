'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { CancelVisitRequest, CancelVisitResponse } from '@/app/api/v1/visits/[id]/cancel/types';
import { visitsBaseKey } from './useVisits';

type CancelVisitVariables = { id: number; request: CancelVisitRequest };

async function cancelVisit({ id, request }: CancelVisitVariables): Promise<CancelVisitResponse> {
  const response = await fetch(`/api/v1/visits/${id}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not cancel Visit');
  }

  return response.json() as Promise<CancelVisitResponse>;
}

type UseCancelVisitOptions = Omit<
  UseMutationOptions<CancelVisitResponse, Error, CancelVisitVariables>,
  'mutationFn'
>;

export function useCancelVisit(options?: UseCancelVisitOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: cancelVisit,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: visitsBaseKey });
      await onSuccess?.(...args);
    },
  });
}
