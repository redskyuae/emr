'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAssetStatusRequest,
  UpdateAssetStatusResponse,
} from '@/app/api/v1/assets/statuses/[id]/types';
import { assetStatusQueryKey } from './useAssetStatus';
import { assetStatusesQueryKey } from './useAssetStatuses';

type UpdateAssetStatusVariables = {
  id: number;
  request: UpdateAssetStatusRequest;
};

async function updateAssetStatus({
  id,
  request,
}: UpdateAssetStatusVariables): Promise<UpdateAssetStatusResponse> {
  const response = await fetch(`/api/v1/assets/statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Asset Status');
  }

  return response.json() as Promise<UpdateAssetStatusResponse>;
}

export function useUpdateAssetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAssetStatus,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: assetStatusesQueryKey });
      void queryClient.invalidateQueries({ queryKey: assetStatusQueryKey(variables.id) });
    },
  });
}
