'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { roomQueryKey } from './useRoom';
import { roomSummaryQueryKey } from './useRoomSummary';
import { removeRoom, roomsQueryKey } from './useRooms';

async function deleteRoom(id: number): Promise<void> {
  const response = await fetch(`/api/v1/rooms/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Room');
  }
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRoom,
    onSuccess: (_data, id) => {
      removeRoom(queryClient, id);
    },
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: roomsQueryKey });
      void queryClient.invalidateQueries({ queryKey: roomQueryKey(id) });
      void queryClient.invalidateQueries({ queryKey: roomSummaryQueryKey });
    },
  });
}
