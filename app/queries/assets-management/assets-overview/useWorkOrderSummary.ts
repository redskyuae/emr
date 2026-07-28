'use client';

import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetWorkOrderSummaryResponse } from '@/app/api/v1/work-orders/summary/types';

export const workOrderSummaryQueryKey = ['work-order-summary'] as const;

async function fetchWorkOrderSummary(): Promise<GetWorkOrderSummaryResponse> {
  const response = await fetch('/api/v1/work-orders/summary', {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Work Order summary');
  }

  return response.json() as Promise<GetWorkOrderSummaryResponse>;
}

export const workOrderSummaryQueryOptions = queryOptions({
  queryKey: workOrderSummaryQueryKey,
  queryFn: fetchWorkOrderSummary,
  select: (response: GetWorkOrderSummaryResponse) => response.data,
});

export function useSuspenseWorkOrderSummary() {
  return useSuspenseQuery(workOrderSummaryQueryOptions);
}
