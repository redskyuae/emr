'use client';

import { useQuery, type QueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListRoomTypesResponse } from '@/app/api/v1/rooms/types/types';

type RoomTypesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const roomTypesQueryKey = ['room-types'] as const;

export const roomTypesParamQueryKey = (params: RoomTypesParams) =>
  [...roomTypesQueryKey, params] as const;

async function fetchRoomTypes(params: RoomTypesParams): Promise<ListRoomTypesResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const response = await fetch(`/api/v1/rooms/types?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Room Types');
  }

  return response.json() as Promise<ListRoomTypesResponse>;
}

export function useRoomTypesQuery(params: RoomTypesParams) {
  return useQuery({
    queryKey: roomTypesParamQueryKey(params),
    queryFn: () => fetchRoomTypes(params),
  });
}

export function removeRoomType(queryClient: QueryClient, id: number) {
  queryClient.setQueriesData<ListRoomTypesResponse>({ queryKey: roomTypesQueryKey }, (previous) => {
    if (!previous) {
      return previous;
    }

    const data = previous.data.filter((roomType) => roomType.id !== id);

    if (data.length === previous.data.length) {
      return previous;
    }

    const total = Math.max(previous.meta.total - 1, 0);
    const totalPages = previous.meta.pageSize > 0 ? Math.ceil(total / previous.meta.pageSize) : 0;

    return { ...previous, data, meta: { ...previous.meta, total, totalPages } };
  });
}
