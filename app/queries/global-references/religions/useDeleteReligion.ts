'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { religionQueryKey } from './useReligion';
import { RELIGIONS_KEY } from './useReligions';

async function deleteReligion(id: number): Promise<void> {
  const response = await fetch(`/api/v1/religions/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Religion');
  }
}

export function useDeleteReligion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReligion,
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: RELIGIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: religionQueryKey(id) });
    },
  });
}
