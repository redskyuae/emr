'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { WARDS_KEY } from './useWards';

async function deleteWard(id: number): Promise<void> {
  const response = await fetch(`/api/v1/wards/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Ward');
  }
}

type UseDeleteWardOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteWard(options?: UseDeleteWardOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteWard,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: WARDS_KEY });
      await onSuccess?.(...args);
    },
  });
}
