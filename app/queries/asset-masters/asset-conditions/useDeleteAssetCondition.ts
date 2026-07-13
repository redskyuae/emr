'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { assetConditionQueryKey } from './useAssetCondition';
import { assetConditionsQueryKey } from './useAssetConditions';

async function deleteAssetCondition(id: number): Promise<void> {
  const response = await fetch(`/api/v1/assets/conditions/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Asset Condition');
  }
}

export function useDeleteAssetCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAssetCondition,
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: assetConditionsQueryKey });
      void queryClient.invalidateQueries({ queryKey: assetConditionQueryKey(id) });
    },
  });
}
