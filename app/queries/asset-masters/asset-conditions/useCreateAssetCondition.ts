'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAssetConditionRequest,
  SaveAssetConditionResponse,
} from '@/app/api/v1/assets/conditions/types';
import { assetConditionsQueryKey } from './useAssetConditions';

async function createAssetCondition(
  request: SaveAssetConditionRequest
): Promise<SaveAssetConditionResponse> {
  const response = await fetch('/api/v1/assets/conditions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Asset Condition');
  }

  return response.json() as Promise<SaveAssetConditionResponse>;
}

export function useCreateAssetCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAssetCondition,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: assetConditionsQueryKey });
    },
  });
}
