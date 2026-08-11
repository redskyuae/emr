'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetCountryResponse } from '@/app/api/v1/countries/[id]/types';

export const countryQueryKey = (id: number) => ['country', id] as const;

async function fetchCountry(id: number): Promise<GetCountryResponse> {
  const response = await fetch(`/api/v1/countries/${id}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Country');
  }

  return response.json() as Promise<GetCountryResponse>;
}

export function useCountryQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['country', 'none'] : countryQueryKey(id),
    queryFn: () => fetchCountry(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
