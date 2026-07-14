'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { UpdateRoomRequest, UpdateRoomResponse } from '@/app/api/v1/rooms/[id]/types';
import { roomQueryKey } from './useRoom';
import { roomSummaryQueryKey } from './useRoomSummary';
import { roomsQueryKey } from './useRooms';

type UpdateRoomVariables = {
  id: number;
  request: UpdateRoomRequest;
};

async function updateRoom({ id, request }: UpdateRoomVariables): Promise<UpdateRoomResponse> {
  const response = await fetch(`/api/v1/rooms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Room');
  }

  return response.json() as Promise<UpdateRoomResponse>;
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRoom,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: roomsQueryKey });
      void queryClient.invalidateQueries({ queryKey: roomQueryKey(variables.id) });
      void queryClient.invalidateQueries({ queryKey: roomSummaryQueryKey });
    },
  });
}
