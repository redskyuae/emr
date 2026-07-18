'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveChargeItemRequest,
  SaveChargeItemResponse,
} from '@/app/api/v1/charge-items/types';
import { CHARGE_ITEMS_KEY } from './useChargeItems';

async function createChargeItem(request: SaveChargeItemRequest): Promise<SaveChargeItemResponse> {
  const response = await fetch('/api/v1/charge-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Charge Item');
  }

  return response.json() as Promise<SaveChargeItemResponse>;
}

type UseCreateChargeItemOptions = Omit<
  UseMutationOptions<SaveChargeItemResponse, Error, SaveChargeItemRequest>,
  'mutationFn'
>;

export function useCreateChargeItem(options?: UseCreateChargeItemOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: createChargeItem,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: CHARGE_ITEMS_KEY });
      await onSuccess?.(...args);
    },
  });
}
