'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateWorkOrderTypeRequest,
  UpdateWorkOrderTypeResponse,
} from '@/app/api/v1/work-orders/types/[id]/types';
import { workOrderTypeQueryKey } from './useWorkOrderType';
import { workOrderTypesQueryKey } from './useWorkOrderTypes';

type UpdateWorkOrderTypeVariables = {
  id: number;
  request: UpdateWorkOrderTypeRequest;
};

async function updateWorkOrderType({
  id,
  request,
}: UpdateWorkOrderTypeVariables): Promise<UpdateWorkOrderTypeResponse> {
  const response = await fetch(`/api/v1/work-orders/types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Work Order Type');
  }

  return response.json() as Promise<UpdateWorkOrderTypeResponse>;
}

export function useUpdateWorkOrderType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorkOrderType,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: workOrderTypesQueryKey });
      void queryClient.invalidateQueries({ queryKey: workOrderTypeQueryKey(variables.id) });
    },
  });
}
