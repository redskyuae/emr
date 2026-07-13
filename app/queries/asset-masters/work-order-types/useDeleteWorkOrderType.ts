'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { workOrderTypeQueryKey } from './useWorkOrderType';
<<<<<<< HEAD
import { removeWorkOrderType, workOrderTypesQueryKey } from './useWorkOrderTypes';
=======
import { workOrderTypesQueryKey } from './useWorkOrderTypes';
>>>>>>> 7a21517 (integrate Work Order Type master screen)

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
<<<<<<< HEAD
    onSuccess: (_data, id) => {
      removeWorkOrderType(queryClient, id);
    },
=======
>>>>>>> 7a21517 (integrate Work Order Type master screen)
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: workOrderTypesQueryKey });
      void queryClient.invalidateQueries({ queryKey: workOrderTypeQueryKey(id) });
    },
  });
}
