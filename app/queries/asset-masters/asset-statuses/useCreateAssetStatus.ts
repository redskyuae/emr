'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAssetStatusRequest,
  SaveAssetStatusResponse,
} from '@/app/api/v1/assets/statuses/types';
import { assetStatusesQueryKey } from './useAssetStatuses';

async function createAssetStatus(
  request: SaveAssetStatusRequest
): Promise<SaveAssetStatusResponse> {
  const response = await fetch('/api/v1/assets/statuses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Asset Status');
  }

  return response.json() as Promise<SaveAssetStatusResponse>;
}

export function useCreateAssetStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAssetStatus,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: assetStatusesQueryKey });
    },
  });
}