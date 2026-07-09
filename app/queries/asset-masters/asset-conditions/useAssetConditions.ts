import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAssetConditionsResponse } from '@/app/api/v1/assets/conditions/types';

type AssetConditionsParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const assetConditionsQueryKey = ['asset-conditions'] as const;

export const assetConditionsParamQueryKey = (params: AssetConditionsParams) =>
  [...assetConditionsQueryKey, params] as const;

async function fetchAssetConditions(
  params: AssetConditionsParams
): Promise<ListAssetConditionsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const response = await fetch(`/api/v1/assets/conditions?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Asset Conditions');
  }

  return response.json() as Promise<ListAssetConditionsResponse>;
}

export function useAssetConditionsQuery(params: AssetConditionsParams) {
  return useQuery({
    queryKey: assetConditionsParamQueryKey(params),
    queryFn: () => fetchAssetConditions(params),
  });
}
