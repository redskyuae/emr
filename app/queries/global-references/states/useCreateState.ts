'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { SaveStateRequest, SaveStateResponse } from '@/app/api/v1/states/types';
import { STATES_KEY } from './useStates';

async function createState(request: SaveStateRequest): Promise<SaveStateResponse> {
  const response = await fetch('/api/v1/states', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create State');
  }

  return response.json() as Promise<SaveStateResponse>;
}

export function useCreateState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createState,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: STATES_KEY });
    },
  });
}
