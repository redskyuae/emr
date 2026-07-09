import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListVisitStatusesResponse } from '@/app/api/v1/visits/statuses/types';

type VisitStatusesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const VISIT_STATUSES_KEY = ['visit-statuses'] as const;

export const visitStatusesQueryKey = (params: VisitStatusesParams) =>
  [...VISIT_STATUSES_KEY, params] as const;

async function fetchVisitStatuses(params: VisitStatusesParams): Promise<ListVisitStatusesResponse> {
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

  const url = `/api/v1/visits/statuses?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Visit Statuses');
  }

  return response.json() as Promise<ListVisitStatusesResponse>;
}

export function useVisitStatusesQuery(params: VisitStatusesParams) {
  return useQuery({
    queryKey: visitStatusesQueryKey(params),
    queryFn: () => fetchVisitStatuses(params),
  });
}

export function useVisitStatuses(params: VisitStatusesParams) {
  return useSuspenseQuery({
    queryKey: visitStatusesQueryKey(params),
    queryFn: () => fetchVisitStatuses(params),
  });
}
