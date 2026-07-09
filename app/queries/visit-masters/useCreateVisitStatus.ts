'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveVisitStatusRequest,
  SaveVisitStatusResponse,
} from '@/app/api/v1/visits/statuses/types';
import { VISIT_STATUSES_KEY } from './useVisitStatuses';

async function createVisitStatus(request: SaveVisitStatusRequest): Promise<SaveVisitStatusResponse> {
  const response = await fetch('/api/v1/visits/statuses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Visit Status');
  }

  return response.json() as Promise<SaveVisitStatusResponse>;
}

type UseCreateVisitStatusOptions = Omit<
  UseMutationOptions<SaveVisitStatusResponse, Error, SaveVisitStatusRequest>,
  'mutationFn'
>;

export function useCreateVisitStatus(options?: UseCreateVisitStatusOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createVisitStatus,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: VISIT_STATUSES_KEY });
      await onSuccess?.(...args);
    },
  });
}
