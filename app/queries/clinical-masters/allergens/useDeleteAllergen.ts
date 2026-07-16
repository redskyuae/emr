'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { ALLERGENS_KEY } from './useAllergens';

async function deleteAllergen(id: number): Promise<void> {
  const response = await fetch(`/api/v1/clinical-masters/allergens/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Allergen');
  }
}

type UseDeleteAllergenOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteAllergen(options?: UseDeleteAllergenOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteAllergen,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: ALLERGENS_KEY });
      await onSuccess?.(...args);
    },
  });
}
