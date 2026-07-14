'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetRoomTypeResponse } from '@/app/api/v1/rooms/types/[id]/types';

export const roomTypeQueryKey = (id: number) => ['room-type', id] as const;

async function fetchRoomType(id: number): Promise<GetRoomTypeResponse> {
  const response = await fetch(`/api/v1/rooms/types/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Room Type');
  }

  return response.json() as Promise<GetRoomTypeResponse>;
}

export function useRoomTypeQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['room-type', 'none'] : roomTypeQueryKey(id),
    queryFn: () => fetchRoomType(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
