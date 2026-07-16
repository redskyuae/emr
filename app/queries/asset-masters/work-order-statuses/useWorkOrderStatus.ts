'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetWorkOrderStatusResponse } from '@/app/api/v1/work-orders/statuses/[id]/types';

export const workOrderStatusQueryKey = (id: number) => ['work-order-status', id] as const;

async function fetchWorkOrderStatus(id: number): Promise<GetWorkOrderStatusResponse> {
  const response = await fetch(`/api/v1/work-orders/statuses/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Work Order Status');
  }

  return response.json() as Promise<GetWorkOrderStatusResponse>;
}

export function useWorkOrderStatusQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['work-order-status', 'none'] : workOrderStatusQueryKey(id),
    queryFn: () => fetchWorkOrderStatus(id!),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
