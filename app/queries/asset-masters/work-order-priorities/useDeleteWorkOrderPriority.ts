'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { workOrderPriorityQueryKey } from './useWorkOrderPriority';
import { workOrderPrioritiesQueryKey } from './useWorkOrderPriorities';

async function deleteWorkOrderPriority(id: number): Promise<void> {
  const response = await fetch(`/api/v1/work-orders/priorities/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Work Order Priority');
  }
}

export function useDeleteWorkOrderPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkOrderPriority,
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: workOrderPrioritiesQueryKey });
      void queryClient.invalidateQueries({ queryKey: workOrderPriorityQueryKey(id) });
    },
  });
}
