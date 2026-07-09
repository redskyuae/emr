'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { visitsBaseKey } from './useVisits';

async function deleteVisit(visitId: number): Promise<void> {
  const response = await fetch(`/api/v1/visits/${visitId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Visit');
  }
}

type UseDeleteVisitOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteVisit(options?: UseDeleteVisitOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteVisit,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: visitsBaseKey });
      await onSuccess?.(...args);
    },
  });
}
