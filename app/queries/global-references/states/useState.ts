'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetStateResponse } from '@/app/api/v1/states/[id]/types';

export const stateQueryKey = (id: number) => ['state', id] as const;

async function fetchState(id: number): Promise<GetStateResponse> {
  const response = await fetch(`/api/v1/states/${id}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load State');
  }

  return response.json() as Promise<GetStateResponse>;
}

export function useStateQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['state', 'none'] : stateQueryKey(id),
    queryFn: () => fetchState(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
