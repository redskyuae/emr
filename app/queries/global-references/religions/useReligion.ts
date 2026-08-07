'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetReligionResponse } from '@/app/api/v1/religions/[id]/types';

export const religionQueryKey = (id: number) => ['religion', id] as const;

async function fetchReligion(id: number): Promise<GetReligionResponse> {
  const response = await fetch(`/api/v1/religions/${id}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Religion');
  }

  return response.json() as Promise<GetReligionResponse>;
}

export function useReligionQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['religion', 'none'] : religionQueryKey(id),
    queryFn: () => fetchReligion(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
