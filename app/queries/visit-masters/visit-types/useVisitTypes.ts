import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListVisitTypesResponse } from '@/app/api/v1/visits/types/types';

type VisitTypesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const VISIT_TYPES_KEY = ['visit-types'] as const;

export const visitTypesQueryKey = (params: VisitTypesParams) =>
  [...VISIT_TYPES_KEY, params] as const;

async function fetchVisitTypes(params: VisitTypesParams): Promise<ListVisitTypesResponse> {
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

  const url = `/api/v1/visits/types?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Visit Types');
  }

  return response.json() as Promise<ListVisitTypesResponse>;
}

export function useVisitTypesQuery(params: VisitTypesParams) {
  return useQuery({
    queryKey: visitTypesQueryKey(params),
    queryFn: () => fetchVisitTypes(params),
  });
}

export function useVisitTypes(params: VisitTypesParams) {
  return useSuspenseQuery({
    queryKey: visitTypesQueryKey(params),
    queryFn: () => fetchVisitTypes(params),
  });
}
