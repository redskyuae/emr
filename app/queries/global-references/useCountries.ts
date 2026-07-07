import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListCountriesResponse } from '@/app/api/v1/countries/types';

// Global References are small, tenant-shared lookup lists — fetched in one page
// (the API's max page size) rather than paginated, since they back select inputs.
const REFERENCE_PAGE_LIMIT = 999;

export const countriesQueryKey = ['countries', 'list'] as const;

async function fetchCountries(): Promise<ListCountriesResponse> {
  const response = await fetch(`/api/v1/countries?limit=${REFERENCE_PAGE_LIMIT}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Countries');
  }

  return response.json() as Promise<ListCountriesResponse>;
}

function transformCountriesResponse(response: ListCountriesResponse) {
  return response.data;
}

export function useCountriesQuery() {
  return useQuery({
    queryKey: countriesQueryKey,
    queryFn: fetchCountries,
    select: transformCountriesResponse,
  });
}
