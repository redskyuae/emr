'use client';

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveChargeItemRequest,
  UpdateChargeItemResponse,
} from '@/app/api/v1/charge-items/types';
import { CHARGE_ITEMS_KEY } from './useChargeItems';

type UpdateChargeItemVariables = {
  id: number;
  request: SaveChargeItemRequest;
};

async function updateChargeItem({
  id,
  request,
}: UpdateChargeItemVariables): Promise<UpdateChargeItemResponse> {
  const response = await fetch(`/api/v1/charge-items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Charge Item');
  }

  return response.json() as Promise<UpdateChargeItemResponse>;
}

type UseUpdateChargeItemOptions = Omit<
  UseMutationOptions<UpdateChargeItemResponse, Error, UpdateChargeItemVariables>,
  'mutationFn'
>;

export function useUpdateChargeItem(options?: UseUpdateChargeItemOptions) {
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: updateChargeItem,
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: CHARGE_ITEMS_KEY });
      await onSuccess?.(...args);
    },
  });
}
