'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetWorkOrderTypeResponse } from '@/app/api/v1/work-orders/types/[id]/types';

export const workOrderTypeQueryKey = (id: number) => ['work-order-type', id] as const;

async function fetchWorkOrderType(id: number): Promise<GetWorkOrderTypeResponse> {
  const response = await fetch(`/api/v1/work-orders/types/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Work Order Type');
  }

  return response.json() as Promise<GetWorkOrderTypeResponse>;
}

export function useWorkOrderTypeQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['work-order-type', 'none'] : workOrderTypeQueryKey(id),
    queryFn: () => fetchWorkOrderType(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
