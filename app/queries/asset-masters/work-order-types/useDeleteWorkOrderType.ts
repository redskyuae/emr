'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { workOrderTypeQueryKey } from './useWorkOrderType';
import { removeWorkOrderType, workOrderTypesQueryKey } from './useWorkOrderTypes';

async function deleteWorkOrderType(id: number): Promise<void> {
  const response = await fetch(`/api/v1/work-orders/types/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Work Order Type');
  }
}

export function useDeleteWorkOrderType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorkOrderType,
    onSuccess: (_data, id) => {
      removeWorkOrderType(queryClient, id);
    },
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: workOrderTypesQueryKey });
      void queryClient.invalidateQueries({ queryKey: workOrderTypeQueryKey(id) });
    },
  });
}
