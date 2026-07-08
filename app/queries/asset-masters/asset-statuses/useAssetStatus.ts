'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetAssetStatusResponse } from '@/app/api/v1/assets/statuses/[id]/types';

export const assetStatusQueryKey = (id: number) => ['asset-status', id] as const;

async function fetchAssetStatus(id: number): Promise<GetAssetStatusResponse> {
  const response = await fetch(`/api/v1/assets/statuses/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Asset Status');
  }

  return response.json() as Promise<GetAssetStatusResponse>;
}

export function useAssetStatusQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['asset-status', 'none'] : assetStatusQueryKey(id),
    queryFn: () => fetchAssetStatus(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
