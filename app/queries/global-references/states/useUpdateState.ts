'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { UpdateStateRequest, UpdateStateResponse } from '@/app/api/v1/states/[id]/types';
import { stateQueryKey } from './useState';
import { STATES_KEY } from './useStates';

export type UpdateStateVariables = {
  id: number;
  request: UpdateStateRequest;
};

async function updateState({ id, request }: UpdateStateVariables): Promise<UpdateStateResponse> {
  const response = await fetch(`/api/v1/states/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update State');
  }

  return response.json() as Promise<UpdateStateResponse>;
}

export function useUpdateState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateState,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: STATES_KEY });
      void queryClient.invalidateQueries({ queryKey: stateQueryKey(variables.id) });
    },
  });
}
