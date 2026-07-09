'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateVisitStatusRequest,
  UpdateVisitStatusResponse,
} from '@/app/api/v1/visits/statuses/[id]/types';
import { VISIT_STATUSES_KEY } from './useVisitStatuses';
import { visitsBaseKey } from '@/app/queries/visits/useVisits';

type UpdateVisitStatusVariables = { id: number; request: UpdateVisitStatusRequest };

async function updateVisitStatus({
  id,
  request,
}: UpdateVisitStatusVariables): Promise<UpdateVisitStatusResponse> {
  const response = await fetch(`/api/v1/visits/statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Visit Status');
  }

  return response.json() as Promise<UpdateVisitStatusResponse>;
}

type UseUpdateVisitStatusOptions = Omit<
  UseMutationOptions<UpdateVisitStatusResponse, Error, UpdateVisitStatusVariables>,
  'mutationFn'
>;

export function useUpdateVisitStatus(options?: UseUpdateVisitStatusOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateVisitStatus,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: VISIT_STATUSES_KEY });
      await queryClient.invalidateQueries({ queryKey: visitsBaseKey });
      await onSuccess?.(...args);
    },
  });
}
