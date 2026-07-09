'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { StartVisitRequest, StartVisitResponse } from '@/app/api/v1/visits/[id]/start/types';
import { visitsBaseKey } from './useVisits';

type StartVisitVariables = { id: number; request?: StartVisitRequest };

async function startVisit({ id, request }: StartVisitVariables): Promise<StartVisitResponse> {
  const response = await fetch(`/api/v1/visits/${id}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request ?? {}),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not start Visit');
  }

  return response.json() as Promise<StartVisitResponse>;
}

type UseStartVisitOptions = Omit<
  UseMutationOptions<StartVisitResponse, Error, StartVisitVariables>,
  'mutationFn'
>;

export function useStartVisit(options?: UseStartVisitOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: startVisit,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: visitsBaseKey });
      await onSuccess?.(...args);
    },
  });
}
