'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { BEDS_KEY } from './useBeds';

async function deleteBed(id: number): Promise<void> {
  const response = await fetch(`/api/v1/beds/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Bed');
  }
}

type UseDeleteBedOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteBed(options?: UseDeleteBedOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteBed,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: BEDS_KEY });
      await onSuccess?.(...args);
    },
  });
}
