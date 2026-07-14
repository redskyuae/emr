'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { SaveRoomRequest, SaveRoomResponse } from '@/app/api/v1/rooms/types';
import { roomSummaryQueryKey } from './useRoomSummary';
import { roomsQueryKey } from './useRooms';

async function createRoom(request: SaveRoomRequest): Promise<SaveRoomResponse> {
  const response = await fetch('/api/v1/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Room');
  }

  return response.json() as Promise<SaveRoomResponse>;
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoom,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomsQueryKey });
      void queryClient.invalidateQueries({ queryKey: roomSummaryQueryKey });
    },
  });
}
