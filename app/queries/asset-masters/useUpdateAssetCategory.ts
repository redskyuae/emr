'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type {
  UpdateAssetCategoryRequest,
  UpdateAssetCategoryResponse,
} from '@/app/api/v1/assets/categories/[id]/types';
import { assetCategoriesQueryKey } from './useAssetCategories';

type UpdateAssetCategoryVariables = {
  id: number;
  request: UpdateAssetCategoryRequest;
};

async function updateAssetCategory({
  id,
  request,
}: UpdateAssetCategoryVariables): Promise<UpdateAssetCategoryResponse> {
  const response = await fetch(`/api/v1/assets/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not update Asset Category');
  }

  return response.json() as Promise<UpdateAssetCategoryResponse>;
}

export function useUpdateAssetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAssetCategory,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: assetCategoriesQueryKey });
    },
  });
}
