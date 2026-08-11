import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListNationalitiesResponse } from '@/app/api/v1/nationalities/types';

const REFERENCE_PAGE_LIMIT = 999;

export type Nationality = ListNationalitiesResponse['data'][number];

export type NationalitiesParams = {
  page?: number;
  limit?: number;
  query?: string;
};

export const NATIONALITIES_KEY = ['nationalities'] as const;

export const nationalitiesQueryKey = (params: NationalitiesParams) =>
  [...NATIONALITIES_KEY, 'list', params] as const;

export const nationalityOptionsQueryKey = [...NATIONALITIES_KEY, 'options'] as const;

function buildNationalitiesUrl(params: NationalitiesParams) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const queryString = searchParams.toString();
  return `/api/v1/nationalities${queryString ? `?${queryString}` : ''}`;
}

async function fetchNationalities(params: NationalitiesParams): Promise<ListNationalitiesResponse> {
  const response = await fetch(buildNationalitiesUrl(params), { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Nationalities');
  }

  return response.json() as Promise<ListNationalitiesResponse>;
}

function transformNationalitiesResponse(response: ListNationalitiesResponse) {
  return response.data;
}

export function useNationalitiesQuery(params: NationalitiesParams) {
  return useQuery({
    queryKey: nationalitiesQueryKey(params),
    queryFn: () => fetchNationalities(params),
  });
}

export function useNationalityOptionsQuery() {
  return useQuery({
    queryKey: nationalityOptionsQueryKey,
    queryFn: () => fetchNationalities({ limit: REFERENCE_PAGE_LIMIT }),
    select: transformNationalitiesResponse,
  });
}
