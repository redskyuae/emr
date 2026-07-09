'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetVisitStatusResponse } from '@/app/api/v1/visits/statuses/[id]/types';

export const visitStatusQueryKey = (id: number) => ['visit-status', id] as const;

async function fetchVisitStatus(id: number): Promise<GetVisitStatusResponse> {
  const response = await fetch(`/api/v1/visits/statuses/${id}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Visit Status');
  }

  return response.json() as Promise<GetVisitStatusResponse>;
}

export function useVisitStatusQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['visit-status', 'none'] : visitStatusQueryKey(id),
    queryFn: () => fetchVisitStatus(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
