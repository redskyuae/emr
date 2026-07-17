import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListWardsResponse } from '@/app/api/v1/wards/types';

type WardsParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const WARDS_KEY = ['wards'] as const;

export const wardsQueryKey = (params: WardsParams) => [...WARDS_KEY, params] as const;

async function fetchWards(params: WardsParams): Promise<ListWardsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set('page', String(params.page));
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.query) {
    searchParams.set('query', params.query);
  }

  const url = `/api/v1/wards?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Wards');
  }

  return response.json() as Promise<ListWardsResponse>;
}

export function useWardsQuery(params: WardsParams) {
  return useQuery({
    queryKey: wardsQueryKey(params),
    queryFn: () => fetchWards(params),
  });
}

export function useWards(params: WardsParams) {
  return useSuspenseQuery({
    queryKey: wardsQueryKey(params),
    queryFn: () => fetchWards(params),
  });
}
