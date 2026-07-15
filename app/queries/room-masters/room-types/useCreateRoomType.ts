'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { SaveRoomTypeRequest, SaveRoomTypeResponse } from '@/app/api/v1/rooms/types/types';
import { roomTypesQueryKey } from './useRoomTypes';

async function createRoomType(request: SaveRoomTypeRequest): Promise<SaveRoomTypeResponse> {
  const response = await fetch('/api/v1/rooms/types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Room Type');
  }

  return response.json() as Promise<SaveRoomTypeResponse>;
}

export function useCreateRoomType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoomType,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: roomTypesQueryKey });
    },
  });
}
