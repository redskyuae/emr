'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveWorkOrderPriorityRequest,
  SaveWorkOrderPriorityResponse,
} from '@/app/api/v1/work-orders/priorities/types';
import { workOrderPrioritiesQueryKey } from './useWorkOrderPriorities';

async function createWorkOrderPriority(
  request: SaveWorkOrderPriorityRequest
): Promise<SaveWorkOrderPriorityResponse> {
  const response = await fetch('/api/v1/work-orders/priorities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Work Order Priority');
  }

  return response.json() as Promise<SaveWorkOrderPriorityResponse>;
}

export function useCreateWorkOrderPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkOrderPriority,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: workOrderPrioritiesQueryKey });
    },
  });
}
