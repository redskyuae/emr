<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import { useQuery, type QueryClient } from '@tanstack/react-query';

=======
"use client"
=======
'use client';
>>>>>>> 0693485 (build updating)
import { useQuery } from '@tanstack/react-query';
>>>>>>> 3530472 (greptil sugesstions updated)
=======
import { useQuery } from '@tanstack/react-query';

>>>>>>> 7a21517 (integrate Work Order Type master screen)
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
<<<<<<< HEAD

export function removeWorkOrderType(queryClient: QueryClient, id: number) {
  queryClient.setQueriesData<ListWorkOrderTypesResponse>(
    { queryKey: workOrderTypesQueryKey },
    (previous) => {
      if (!previous) {
        return previous;
      }

      const data = previous.data.filter((type) => type.id !== id);

      if (data.length === previous.data.length) {
        return previous;
      }

      const total = Math.max(previous.meta.total - 1, 0);
      const totalPages = previous.meta.pageSize > 0 ? Math.ceil(total / previous.meta.pageSize) : 0;

      return { ...previous, data, meta: { ...previous.meta, total, totalPages } };
    }
  );
}
=======
>>>>>>> 7a21517 (integrate Work Order Type master screen)
