import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListReligionsResponse } from '@/app/api/v1/religions/types';

const REFERENCE_PAGE_LIMIT = 999;

export type Religion = ListReligionsResponse['data'][number];

export type ReligionsParams = {
  page?: number;
  limit?: number;
  query?: string;
};

export const RELIGIONS_KEY = ['religions'] as const;

export const religionsQueryKey = (params: ReligionsParams) =>
  [...RELIGIONS_KEY, 'list', params] as const;

export const religionOptionsQueryKey = [...RELIGIONS_KEY, 'options'] as const;

function buildReligionsUrl(params: ReligionsParams) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const queryString = searchParams.toString();
  return `/api/v1/religions${queryString ? `?${queryString}` : ''}`;
}

async function fetchReligions(params: ReligionsParams): Promise<ListReligionsResponse> {
  const response = await fetch(buildReligionsUrl(params), { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Religions');
  }

  return response.json() as Promise<ListReligionsResponse>;
}

function transformReligionsResponse(response: ListReligionsResponse) {
  return response.data;
}

export function useReligionsQuery(params: ReligionsParams) {
  return useQuery({
    queryKey: religionsQueryKey(params),
    queryFn: () => fetchReligions(params),
  });
}

export function useReligionOptionsQuery() {
  return useQuery({
    queryKey: religionOptionsQueryKey,
    queryFn: () => fetchReligions({ limit: REFERENCE_PAGE_LIMIT }),
    select: transformReligionsResponse,
  });
}
