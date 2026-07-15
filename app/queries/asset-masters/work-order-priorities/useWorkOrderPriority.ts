'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetWorkOrderPriorityResponse } from '@/app/api/v1/work-orders/priorities/[id]/types';

export const workOrderPriorityQueryKey = (id: number) => ['work-order-priority', id] as const;

async function fetchWorkOrderPriority(id: number): Promise<GetWorkOrderPriorityResponse> {
  const response = await fetch(`/api/v1/work-orders/priorities/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Work Order Priority');
  }

  return response.json() as Promise<GetWorkOrderPriorityResponse>;
}

export function useWorkOrderPriorityQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['work-order-priority', 'none'] : workOrderPriorityQueryKey(id),
    queryFn: () => fetchWorkOrderPriority(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
