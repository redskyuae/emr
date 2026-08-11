'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { nationalityQueryKey } from './useNationality';
import { NATIONALITIES_KEY } from './useNationalities';

async function deleteNationality(id: number): Promise<void> {
  const response = await fetch(`/api/v1/nationalities/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Nationality');
  }
}

export function useDeleteNationality() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNationality,
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: NATIONALITIES_KEY });
      void queryClient.invalidateQueries({ queryKey: nationalityQueryKey(id) });
    },
  });
}
