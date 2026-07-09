import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAssetStatusesResponse } from '@/app/api/v1/assets/statuses/types';

type AssetStatusesParams = {
  query?: string;
  page?: number;
  limit?: number;
};

export const assetStatusesQueryKey = ['asset-statuses'] as const;

export const assetStatusesParamQueryKey = (params: AssetStatusesParams) =>
  [...assetStatusesQueryKey, params] as const;

async function fetchAssetStatuses(params: AssetStatusesParams): Promise<ListAssetStatusesResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const response = await fetch(`/api/v1/assets/statuses?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Asset Statuses');
  }

  return response.json() as Promise<ListAssetStatusesResponse>;
}

export function useAssetStatusesQuery(params: AssetStatusesParams) {
  return useQuery({
    queryKey: assetStatusesParamQueryKey(params),
    queryFn: () => fetchAssetStatuses(params),
  });
}
