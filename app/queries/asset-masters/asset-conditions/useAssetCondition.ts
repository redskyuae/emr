'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetAssetConditionResponse } from '@/app/api/v1/assets/conditions/[id]/types';

export const assetConditionQueryKey = (id: number) => ['asset-condition', id] as const;

async function fetchAssetCondition(id: number): Promise<GetAssetConditionResponse> {
  const response = await fetch(`/api/v1/assets/conditions/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Asset Condition');
  }

  return response.json() as Promise<GetAssetConditionResponse>;
}

export function useAssetConditionQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['asset-condition', 'none'] : assetConditionQueryKey(id),
    queryFn: () => fetchAssetCondition(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
