import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListWorkOrderStatusesResponse } from '@/app/api/v1/work-orders/statuses/types';

type WorkOrderStatusesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const workOrderStatusesQueryKey = ['work-order-statuses'] as const;

export const workOrderStatusesParamQueryKey = (params: WorkOrderStatusesParams) =>
  [...workOrderStatusesQueryKey, params] as const;

async function fetchWorkOrderStatuses(
  params: WorkOrderStatusesParams
): Promise<ListWorkOrderStatusesResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const response = await fetch(`/api/v1/work-orders/statuses?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Work Order Statuses');
  }

  return response.json() as Promise<ListWorkOrderStatusesResponse>;
}

export function useWorkOrderStatusesQuery(params: WorkOrderStatusesParams) {
  return useQuery({
    queryKey: workOrderStatusesParamQueryKey(params),
    queryFn: () => fetchWorkOrderStatuses(params),
  });
}
