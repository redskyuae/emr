'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { ADMIT_SOURCES_KEY } from './useAdmitSources';

async function deleteAdmitSource(id: number): Promise<void> {
  const response = await fetch(`/api/v1/visits/admit-sources/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Admit Source');
  }
}

type UseDeleteAdmitSourceOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteAdmitSource(options?: UseDeleteAdmitSourceOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteAdmitSource,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: ADMIT_SOURCES_KEY });
      await onSuccess?.(...args);
    },
  });
}
