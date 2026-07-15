'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetRoomResponse } from '@/app/api/v1/rooms/[id]/types';

export const roomQueryKey = (id: number) => ['room', id] as const;

async function fetchRoom(id: number): Promise<GetRoomResponse> {
  const response = await fetch(`/api/v1/rooms/${id}`, { credentials: 'same-origin' });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Room');
  }

  return response.json() as Promise<GetRoomResponse>;
}

export function useRoomQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['room', 'none'] : roomQueryKey(id),
    queryFn: () => fetchRoom(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
