'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { UpdateVisitRequest, UpdateVisitResponse } from '@/app/api/v1/visits/[id]/types';
import { visitQueryKey } from './useVisit';
import { VISITS_KEY } from './useVisits';

type UpdateVisitVariables = {
  id: number;
  request: UpdateVisitRequest;
};

async function updateVisit({ id, request }: UpdateVisitVariables): Promise<UpdateVisitResponse> {
  const response = await fetch(`/api/v1/visits/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update the Visit');
  }

  return response.json() as Promise<UpdateVisitResponse>;
}

type UseUpdateVisitOptions = Omit<
  UseMutationOptions<UpdateVisitResponse, Error, UpdateVisitVariables>,
  'mutationFn'
>;

export function useUpdateVisit(options?: UseUpdateVisitOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateVisit,
    onSuccess: async (...args) => {
      const [, { id }] = args;
      await queryClient.invalidateQueries({ queryKey: VISITS_KEY });
      await queryClient.invalidateQueries({ queryKey: visitQueryKey(id) });
      await onSuccess?.(...args);
    },
  });
}
