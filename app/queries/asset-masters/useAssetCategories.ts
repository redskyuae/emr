import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAssetCategoriesResponse } from '@/app/api/v1/assets/categories/types';

type AssetCategoriesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const assetCategoriesQueryKey = ['asset-categories'] as const;

export const assetCategoriesParamQueryKey = (params: AssetCategoriesParams) =>
  [...assetCategoriesQueryKey, params] as const;

async function fetchAssetCategories(
  params: AssetCategoriesParams
): Promise<ListAssetCategoriesResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const response = await fetch(
    `/api/v1/assets/categories?${searchParams.toString()}`,
    { credentials: 'same-origin' }
  );

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Asset Categories');
  }

  return response.json() as Promise<ListAssetCategoriesResponse>;
}

export function useAssetCategoriesQuery(params: AssetCategoriesParams) {
  return useQuery({
    queryKey: assetCategoriesParamQueryKey(params),
    queryFn: () => fetchAssetCategories(params),
  });
}
