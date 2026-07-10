import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListWorkOrderTypesResponse } from '@/app/api/v1/work-orders/types/types';

type WorkOrderTypesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const workOrderTypesQueryKey = ['work-order-types'] as const;

export const workOrderTypesParamQueryKey = (params: WorkOrderTypesParams) =>
  [...workOrderTypesQueryKey, params] as const;

async function fetchWorkOrderTypes(
  params: WorkOrderTypesParams
): Promise<ListWorkOrderTypesResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const response = await fetch(`/api/v1/work-orders/types?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Work Order Types');
  }

  return response.json() as Promise<ListWorkOrderTypesResponse>;
}

export function useWorkOrderTypesQuery(params: WorkOrderTypesParams) {
  return useQuery({
    queryKey: workOrderTypesParamQueryKey(params),
    queryFn: () => fetchWorkOrderTypes(params),
  });
}
