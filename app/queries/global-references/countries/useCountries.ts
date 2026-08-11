import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListCountriesResponse } from '@/app/api/v1/countries/types';

const REFERENCE_PAGE_LIMIT = 999;

export type Country = ListCountriesResponse['data'][number];

export type CountriesParams = {
  page?: number;
  limit?: number;
  query?: string;
};

export const COUNTRIES_KEY = ['countries'] as const;

export const countriesQueryKey = (params: CountriesParams) =>
  [...COUNTRIES_KEY, 'list', params] as const;

export const countryOptionsQueryKey = [...COUNTRIES_KEY, 'options'] as const;

function buildCountriesUrl(params: CountriesParams) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const queryString = searchParams.toString();
  return `/api/v1/countries${queryString ? `?${queryString}` : ''}`;
}

async function fetchCountries(params: CountriesParams): Promise<ListCountriesResponse> {
  const response = await fetch(buildCountriesUrl(params), { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Countries');
  }

  return response.json() as Promise<ListCountriesResponse>;
}

function transformCountriesResponse(response: ListCountriesResponse) {
  return response.data;
}

export function useCountriesQuery(params: CountriesParams) {
  return useQuery({
    queryKey: countriesQueryKey(params),
    queryFn: () => fetchCountries(params),
  });
}

export function useCountryOptionsQuery() {
  return useQuery({
    queryKey: countryOptionsQueryKey,
    queryFn: () => fetchCountries({ limit: REFERENCE_PAGE_LIMIT }),
    select: transformCountriesResponse,
  });
}
