'use client';
import { useQuery } from '@tanstack/react-query';
import { parseApiError } from '@/app/queries/api-error';
import type { ListWorkOrderPrioritiesResponse } from '@/app/api/v1/work-orders/priorities/types';

type WorkOrderPrioritiesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const workOrderPrioritiesQueryKey = ['work-order-priorities'] as const;

export const workOrderPrioritiesParamQueryKey = (params: WorkOrderPrioritiesParams) =>
  [...workOrderPrioritiesQueryKey, params] as const;

async function fetchWorkOrderPriorities(
  params: WorkOrderPrioritiesParams
): Promise<ListWorkOrderPrioritiesResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const response = await fetch(`/api/v1/work-orders/priorities?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Work Order Priorities');
  }

  return response.json() as Promise<ListWorkOrderPrioritiesResponse>;
}

export function useWorkOrderPrioritiesQuery(params: WorkOrderPrioritiesParams) {
  return useQuery({
    queryKey: workOrderPrioritiesParamQueryKey(params),
    queryFn: () => fetchWorkOrderPriorities(params),
  });
}
