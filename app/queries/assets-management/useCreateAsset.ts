'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { SaveAssetRequest, SaveAssetResponse } from '@/app/api/v1/assets/types';
import { assetsQueryKey } from './useAssets';

async function createAsset(request: SaveAssetRequest): Promise<SaveAssetResponse> {
  const response = await fetch('/api/v1/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Asset');
  }

  return response.json() as Promise<SaveAssetResponse>;
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAsset,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: assetsQueryKey });
    },
  });
}
