import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListWorkOrdersResponse } from '@/app/api/v1/work-orders/types';

type WorkOrdersParams = {
  query?: string;
  page?: number;
  limit?: number;
  typeId?: number;
};

export const workOrdersQueryKey = ['work-orders'] as const;

export const workOrdersParamQueryKey = (params: WorkOrdersParams) =>
  [...workOrdersQueryKey, params] as const;

async function fetchWorkOrders(params: WorkOrdersParams): Promise<ListWorkOrdersResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);
  if (params.typeId) searchParams.set('typeId', String(params.typeId));

  const response = await fetch(`/api/v1/work-orders?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Work Orders');
  }

  return response.json() as Promise<ListWorkOrdersResponse>;
}

export function useWorkOrdersQuery(params: WorkOrdersParams) {
  return useQuery({
    queryKey: workOrdersParamQueryKey(params),
    queryFn: () => fetchWorkOrders(params),
  });
}
