'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { workOrderStatusQueryKey } from './useWorkOrderStatus';
import { removeWorkOrderStatus, workOrderStatusesQueryKey } from './useWorkOrderStatuses';

async function deleteWorkOrderStatus(id: number): Promise<void> {
  const response = await fetch(`/api/v1/work-orders/statuses/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Work Order Status');
  }
}

export function useDeleteWorkOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkOrderStatus,
    onSuccess: (_data, id) => {
      removeWorkOrderStatus(queryClient, id);
    },
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: workOrderStatusesQueryKey });
      void queryClient.invalidateQueries({ queryKey: workOrderStatusQueryKey(id) });
    },
  });
}
