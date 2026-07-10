'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveWorkOrderTypeRequest,
  SaveWorkOrderTypeResponse,
} from '@/app/api/v1/work-orders/types/types';
import { workOrderTypesQueryKey } from './useWorkOrderTypes';

async function createWorkOrderType(
  request: SaveWorkOrderTypeRequest
): Promise<SaveWorkOrderTypeResponse> {
  const response = await fetch('/api/v1/work-orders/types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Work Order Type');
  }

  return response.json() as Promise<SaveWorkOrderTypeResponse>;
}

export function useCreateWorkOrderType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkOrderType,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: workOrderTypesQueryKey });
    },
  });
}
