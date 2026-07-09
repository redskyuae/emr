'use client';

import { useQuery, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetVisitResponse } from '@/app/api/v1/visits/[id]/types';

export const visitDetailQueryKey = (visitId: number) => ['visits', 'detail', visitId] as const;

async function fetchVisit(visitId: number): Promise<GetVisitResponse> {
  const response = await fetch(`/api/v1/visits/${visitId}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Visit');
  }

  return response.json() as Promise<GetVisitResponse>;
}

export function useVisitQuery(visitId: number | null) {
  return useQuery({
    queryKey: visitId === null ? ['visits', 'detail', 'none'] : visitDetailQueryKey(visitId),
    queryFn: () => fetchVisit(visitId ?? 0),
    enabled: visitId !== null,
    select: (response) => response.data,
  });
}

export function useVisit(visitId: number) {
  return useSuspenseQuery({
    queryKey: visitDetailQueryKey(visitId),
    queryFn: () => fetchVisit(visitId),
    select: (response) => response.data,
  });
}
