'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { ListSpecialtiesResponse } from '@/app/api/v1/specialties/types';
import { parseApiError } from '@/app/queries/api-error';

export type SpecialtyListFilters = {
  page?: number;
  limit?: number;
  query?: string;
};

export const specialtiesQueryKey = (filters: SpecialtyListFilters) =>
  ['specialties', filters] as const;

function buildSpecialtyListParams(filters: SpecialtyListFilters) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 10));

  if (filters.query) {
    params.set('query', filters.query);
  }

  return params.toString();
}

async function fetchSpecialtyList(filters: SpecialtyListFilters): Promise<ListSpecialtiesResponse> {
  const response = await fetch(`/api/v1/specialties?${buildSpecialtyListParams(filters)}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Specialties');
  }

  return response.json() as Promise<ListSpecialtiesResponse>;
}

export function useSpecialtiesQuery(filters: SpecialtyListFilters = {}) {
  return useQuery({
    queryKey: specialtiesQueryKey(filters),
    queryFn: () => fetchSpecialtyList(filters),
    placeholderData: keepPreviousData,
  });
}
