import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAdmitSourcesResponse } from '@/app/api/v1/visits/admit-sources/types';

type AdmitSourcesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const ADMIT_SOURCES_KEY = ['admit-sources'] as const;

const admitSourcesQueryKey = (params: AdmitSourcesParams) =>
  [...ADMIT_SOURCES_KEY, params] as const;

async function fetchAdmitSources(params: AdmitSourcesParams): Promise<ListAdmitSourcesResponse> {
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

  const url = `/api/v1/visits/admit-sources?${searchParams.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Admit Sources');
  }

  return response.json() as Promise<ListAdmitSourcesResponse>;
}

export function useAdmitSourcesQuery(params: AdmitSourcesParams) {
  return useQuery({
    queryKey: admitSourcesQueryKey(params),
    queryFn: () => fetchAdmitSources(params),
  });
}
