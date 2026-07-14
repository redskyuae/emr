'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetRoomSummaryResponse } from '@/app/api/v1/rooms/summary/types';

export const roomSummaryQueryKey = ['room-summary'] as const;

async function fetchRoomSummary(): Promise<GetRoomSummaryResponse> {
  const response = await fetch('/api/v1/rooms/summary', { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Room summary');
  }

  return response.json() as Promise<GetRoomSummaryResponse>;
}

export function useRoomSummaryQuery() {
  return useQuery({
    queryKey: roomSummaryQueryKey,
    queryFn: fetchRoomSummary,
    select: (response) => response.data,
  });
}
