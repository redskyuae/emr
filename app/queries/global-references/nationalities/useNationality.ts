'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetNationalityResponse } from '@/app/api/v1/nationalities/[id]/types';

export const nationalityQueryKey = (id: number) => ['nationality', id] as const;

async function fetchNationality(id: number): Promise<GetNationalityResponse> {
  const response = await fetch(`/api/v1/nationalities/${id}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Nationality');
  }

  return response.json() as Promise<GetNationalityResponse>;
}

export function useNationalityQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['nationality', 'none'] : nationalityQueryKey(id),
    queryFn: () => fetchNationality(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
