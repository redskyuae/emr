'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveWorkOrderStatusRequest,
  SaveWorkOrderStatusResponse,
} from '@/app/api/v1/work-orders/statuses/types';
import { workOrderStatusesQueryKey } from './useWorkOrderStatuses';

async function createWorkOrderStatus(
  request: SaveWorkOrderStatusRequest
): Promise<SaveWorkOrderStatusResponse> {
  const response = await fetch('/api/v1/work-orders/statuses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Work Order Status');
  }

  return response.json() as Promise<SaveWorkOrderStatusResponse>;
}

export function useCreateWorkOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkOrderStatus,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: workOrderStatusesQueryKey });
    },
  });
}
