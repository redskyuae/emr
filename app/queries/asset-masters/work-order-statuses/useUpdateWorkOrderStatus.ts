'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateWorkOrderStatusRequest,
  UpdateWorkOrderStatusResponse,
} from '@/app/api/v1/work-orders/statuses/[id]/types';
import { workOrderStatusQueryKey } from './useWorkOrderStatus';
import { workOrderStatusesQueryKey } from './useWorkOrderStatuses';

type UpdateWorkOrderStatusVariables = {
  id: number;
  request: UpdateWorkOrderStatusRequest;
};

async function updateWorkOrderStatus({
  id,
  request,
}: UpdateWorkOrderStatusVariables): Promise<UpdateWorkOrderStatusResponse> {
  const response = await fetch(`/api/v1/work-orders/statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Work Order Status');
  }

  return response.json() as Promise<UpdateWorkOrderStatusResponse>;
}

export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkOrderStatus,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: workOrderStatusesQueryKey });
      void queryClient.invalidateQueries({ queryKey: workOrderStatusQueryKey(variables.id) });
    },
  });
}
