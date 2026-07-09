'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { assetStatusQueryKey } from './useAssetStatus';
import { assetStatusesQueryKey } from './useAssetStatuses';

async function deleteAssetStatus(id: number): Promise<void> {
  const response = await fetch(`/api/v1/assets/statuses/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Asset Status');
  }
}

export function useDeleteAssetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAssetStatus,
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: assetStatusesQueryKey });
      void queryClient.invalidateQueries({ queryKey: assetStatusQueryKey(id) });
    },
  });
}
