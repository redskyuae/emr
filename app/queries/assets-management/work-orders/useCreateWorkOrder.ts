import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  CreateWorkOrderRequest,
  CreateWorkOrderResponse,
} from '@/app/api/v1/work-orders/types';
import { workOrderSummaryQueryKey } from '@/app/queries/assets-management/assets-overview/useWorkOrderSummary';
import { workOrdersQueryKey } from './useWorkOrders';

async function createWorkOrder(request: CreateWorkOrderRequest): Promise<CreateWorkOrderResponse> {
  const response = await fetch('/api/v1/work-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Work Order');
  }

  return response.json() as Promise<CreateWorkOrderResponse>;
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorkOrder,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: workOrdersQueryKey });
      void queryClient.invalidateQueries({ queryKey: workOrderSummaryQueryKey });
    },
  });
}
