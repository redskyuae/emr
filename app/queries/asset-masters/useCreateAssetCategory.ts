'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  SaveAssetCategoryRequest,
  SaveAssetCategoryResponse,
} from '@/app/api/v1/assets/categories/types';
import { assetCategoriesQueryKey } from './useAssetCategories';

async function createAssetCategory(
  request: SaveAssetCategoryRequest
): Promise<SaveAssetCategoryResponse> {
  const response = await fetch('/api/v1/assets/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not create Asset Category');
  }

  return response.json() as Promise<SaveAssetCategoryResponse>;
}

export function useCreateAssetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAssetCategory,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: assetCategoriesQueryKey });
    },
  });
}
