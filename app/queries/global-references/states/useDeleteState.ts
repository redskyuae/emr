'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { stateQueryKey } from './useState';
import { STATES_KEY } from './useStates';

async function deleteState(id: number): Promise<void> {
  const response = await fetch(`/api/v1/states/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete State');
  }
}

export function useDeleteState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteState,
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: STATES_KEY });
      void queryClient.invalidateQueries({ queryKey: stateQueryKey(id) });
    },
  });
}
