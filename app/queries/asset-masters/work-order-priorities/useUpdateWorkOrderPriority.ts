'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateWorkOrderPriorityRequest,
  UpdateWorkOrderPriorityResponse,
} from '@/app/api/v1/work-orders/priorities/[id]/types';
import { workOrderPriorityQueryKey } from './useWorkOrderPriority';
import { workOrderPrioritiesQueryKey } from './useWorkOrderPriorities';

type UpdateWorkOrderPriorityVariables = {
  id: number;
  request: UpdateWorkOrderPriorityRequest;
};

async function updateWorkOrderPriority({
  id,
  request,
}: UpdateWorkOrderPriorityVariables): Promise<UpdateWorkOrderPriorityResponse> {
  const response = await fetch(`/api/v1/work-orders/priorities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Work Order Priority');
  }

  return response.json() as Promise<UpdateWorkOrderPriorityResponse>;
}

export function useUpdateWorkOrderPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkOrderPriority,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: workOrderPrioritiesQueryKey });
      void queryClient.invalidateQueries({ queryKey: workOrderPriorityQueryKey(variables.id) });
    },
  });
}
