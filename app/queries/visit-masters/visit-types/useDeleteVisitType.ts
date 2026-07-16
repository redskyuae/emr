'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { VISIT_TYPES_KEY } from './useVisitTypes';

async function deleteVisitType(id: number): Promise<void> {
  const response = await fetch(`/api/v1/visits/types/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Visit Type');
  }
}

type UseDeleteVisitTypeOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteVisitType(options?: UseDeleteVisitTypeOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteVisitType,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: VISIT_TYPES_KEY });
      await onSuccess?.(...args);
    },
  });
}
