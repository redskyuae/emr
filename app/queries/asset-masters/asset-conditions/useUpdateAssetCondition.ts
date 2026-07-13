'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAssetConditionRequest,
  UpdateAssetConditionResponse,
} from '@/app/api/v1/assets/conditions/[id]/types';
import { assetConditionQueryKey } from './useAssetCondition';
import { assetConditionsQueryKey } from './useAssetConditions';

type UpdateAssetConditionVariables = {
  id: number;
  request: UpdateAssetConditionRequest;
};

async function updateAssetCondition({
  id,
  request,
}: UpdateAssetConditionVariables): Promise<UpdateAssetConditionResponse> {
  const response = await fetch(`/api/v1/assets/conditions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Asset Condition');
  }

  return response.json() as Promise<UpdateAssetConditionResponse>;
}

export function useUpdateAssetCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAssetCondition,
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries({ queryKey: assetConditionsQueryKey });
      void queryClient.invalidateQueries({ queryKey: assetConditionQueryKey(variables.id) });
    },
  });
}
