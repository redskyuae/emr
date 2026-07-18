import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListChargeItemsResponse } from '@/app/api/v1/charge-items/types';

export type ChargeItemsParams = {
  query?: string;
  page?: number;
  limit?: number;
  category?: string;
  isActive?: boolean;
};

export const CHARGE_ITEMS_KEY = ['charge-items'] as const;

export const chargeItemsQueryKey = (params: ChargeItemsParams) =>
  [...CHARGE_ITEMS_KEY, 'list', params] as const;

async function fetchChargeItems(params: ChargeItemsParams): Promise<ListChargeItemsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);
  if (params.category) searchParams.set('category', params.category);
  if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive));

  const response = await fetch(`/api/v1/charge-items?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Charge Items');
  }

  return response.json() as Promise<ListChargeItemsResponse>;
}

// Non-suspense: the masters screen's category/active filters drive this query, and
// switching a filter must not blow away the surrounding toolbar and chrome.
export function useChargeItemsQuery(params: ChargeItemsParams) {
  return useQuery({
    queryKey: chargeItemsQueryKey(params),
    queryFn: () => fetchChargeItems(params),
  });
}

export function useChargeItems(params: ChargeItemsParams) {
  return useSuspenseQuery({
    queryKey: chargeItemsQueryKey(params),
    queryFn: () => fetchChargeItems(params),
  });
}
