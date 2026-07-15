'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { roomTypeQueryKey } from './useRoomType';
import { removeRoomType, roomTypesQueryKey } from './useRoomTypes';

async function deleteRoomType(id: number): Promise<void> {
  const response = await fetch(`/api/v1/rooms/types/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Room Type');
  }
}

export function useDeleteRoomType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRoomType,
    onSuccess: (_data, id) => {
      removeRoomType(queryClient, id);
    },
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: roomTypesQueryKey });
      void queryClient.invalidateQueries({ queryKey: roomTypeQueryKey(id) });
    },
  });
}
