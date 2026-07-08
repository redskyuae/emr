'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetAssetCategoryResponse } from '@/app/api/v1/assets/categories/[id]/types';

export const assetCategoryQueryKey = (id: number) => ['asset-category', id] as const;

async function fetchAssetCategory(id: number): Promise<GetAssetCategoryResponse> {
  const response = await fetch(`/api/v1/assets/categories/${id}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Asset Category');
  }

  return response.json() as Promise<GetAssetCategoryResponse>;
}

export function useAssetCategoryQuery(id: number | null) {
  return useQuery({
    queryKey: id === null ? ['asset-category', 'none'] : assetCategoryQueryKey(id),
    queryFn: () => fetchAssetCategory(id ?? 0),
    enabled: id !== null,
    select: (response) => response.data,
  });
}
