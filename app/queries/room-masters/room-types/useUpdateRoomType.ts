'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateRoomTypeRequest,
  UpdateRoomTypeResponse,
} from '@/app/api/v1/rooms/types/[id]/types';
import { roomTypeQueryKey } from './useRoomType';
import { roomTypesQueryKey } from './useRoomTypes';

type UpdateRoomTypeVariables = {
  id: number;
  request: UpdateRoomTypeRequest;
};

async function updateRoomType({
  id,
  request,
}: UpdateRoomTypeVariables): Promise<UpdateRoomTypeResponse> {
  const response = await fetch(`/api/v1/rooms/types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Room Type');
  }

  return response.json() as Promise<UpdateRoomTypeResponse>;
}

export function useUpdateRoomType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRoomType,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: roomTypesQueryKey });
      void queryClient.invalidateQueries({ queryKey: roomTypeQueryKey(variables.id) });
    },
  });
}
