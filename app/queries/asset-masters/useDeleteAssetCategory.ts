'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import { assetCategoryQueryKey } from './useAssetCategory';
import { assetCategoriesQueryKey } from './useAssetCategories';

async function deleteAssetCategory(id: number): Promise<void> {
  const response = await fetch(`/api/v1/assets/categories/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not delete Asset Category');
  }
}

export function useDeleteAssetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAssetCategory,
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: assetCategoriesQueryKey });
      void queryClient.invalidateQueries({ queryKey: assetCategoryQueryKey(id) });
    },
  });
}
