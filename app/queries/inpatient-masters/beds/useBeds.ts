import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListBedsResponse } from '@/app/api/v1/beds/types';

export type BedsParams = {
  query?: string;
  page?: number;
  limit?: number;
  wardId?: number;
  status?: string;
};

export const BEDS_KEY = ['beds'] as const;

export const bedsQueryKey = (params: BedsParams) => [...BEDS_KEY, 'list', params] as const;

async function fetchBeds(params: BedsParams): Promise<ListBedsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);
  if (params.wardId) searchParams.set('wardId', String(params.wardId));
  if (params.status) searchParams.set('status', params.status);

  const response = await fetch(`/api/v1/beds?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Beds');
  }

  return response.json() as Promise<ListBedsResponse>;
}

// Non-suspense: the masters screen's ward/status filters drive this query, and
// switching a filter must not blow away the surrounding toolbar and chrome.
export function useBedsQuery(params: BedsParams) {
  return useQuery({
    queryKey: bedsQueryKey(params),
    queryFn: () => fetchBeds(params),
  });
}

export function useBeds(params: BedsParams) {
  return useSuspenseQuery({
    queryKey: bedsQueryKey(params),
    queryFn: () => fetchBeds(params),
  });
}
