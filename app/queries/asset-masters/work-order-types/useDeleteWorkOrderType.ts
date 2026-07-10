'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { workOrderTypeQueryKey } from './useWorkOrderType';
import { workOrderTypesQueryKey } from './useWorkOrderTypes';

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
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: workOrderTypesQueryKey });
      void queryClient.invalidateQueries({ queryKey: workOrderTypeQueryKey(id) });
    },
  });
}
