'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { CHARGE_ITEMS_KEY } from './useChargeItems';

async function deleteChargeItem(id: number): Promise<void> {
  const response = await fetch(`/api/v1/charge-items/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Charge Item');
  }
}

type UseDeleteChargeItemOptions = Omit<UseMutationOptions<void, Error, number>, 'mutationFn'>;

export function useDeleteChargeItem(options?: UseDeleteChargeItemOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: deleteChargeItem,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: CHARGE_ITEMS_KEY });
      await onSuccess?.(...args);
    },
  });
}
