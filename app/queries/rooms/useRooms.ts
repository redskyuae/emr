'use client';

import { useQuery, type QueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { RoomStatus } from '@/app/api/lib/modules/room/schemas/room-schema';
import type { ListRoomsResponse } from '@/app/api/v1/rooms/types';

type RoomsParams = {
  query?: string;
  page?: number;
  limit?: number;
  status?: RoomStatus;
  roomTypeId?: number;
};

export const roomsQueryKey = ['rooms'] as const;

export const roomsParamQueryKey = (params: RoomsParams) => [...roomsQueryKey, params] as const;

async function fetchRooms(params: RoomsParams): Promise<ListRoomsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);
  if (params.status) searchParams.set('status', params.status);
  if (params.roomTypeId) searchParams.set('roomTypeId', String(params.roomTypeId));

  const response = await fetch(`/api/v1/rooms?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Rooms');
  }

  return response.json() as Promise<ListRoomsResponse>;
}

export function useRoomsQuery(params: RoomsParams) {
  return useQuery({
    queryKey: roomsParamQueryKey(params),
    queryFn: () => fetchRooms(params),
  });
}

export function removeRoom(queryClient: QueryClient, id: number) {
  queryClient.setQueriesData<ListRoomsResponse>({ queryKey: roomsQueryKey }, (previous) => {
    if (!previous) {
      return previous;
    }

    const data = previous.data.filter((room) => room.id !== id);

    if (data.length === previous.data.length) {
      return previous;
    }

    const total = Math.max(previous.meta.total - 1, 0);
    const totalPages = previous.meta.pageSize > 0 ? Math.ceil(total / previous.meta.pageSize) : 0;

    return { ...previous, data, meta: { ...previous.meta, total, totalPages } };
  });
}
