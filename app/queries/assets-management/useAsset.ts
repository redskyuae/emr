'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetAssetResponse } from '@/app/api/v1/assets/[id]/types';

export const assetQueryKey = (id: number) => ['asset', id] as const;

async function fetchAsset(id: number): Promise<GetAssetResponse> {
  const response = await fetch(`/api/v1/assets/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Asset');
  }

  return response.json() as Promise<GetAssetResponse>;
}

export function useAssetQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['asset', 'none'] : assetQueryKey(id),
    queryFn: () => fetchAsset(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
