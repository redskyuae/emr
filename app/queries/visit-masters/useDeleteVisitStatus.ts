'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { VISIT_STATUSES_KEY } from './useVisitStatuses';

async function deleteVisitStatus(id: number): Promise<void> {
  const response = await fetch(`/api/v1/visits/statuses/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Visit Status');
  }
}

type UseDeleteVisitStatusOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteVisitStatus(options?: UseDeleteVisitStatusOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteVisitStatus,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: VISIT_STATUSES_KEY });
      await onSuccess?.(...args);
    },
  });
}
