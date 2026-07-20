'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { ListAssetsResponse } from '@/app/api/v1/assets/types';

type AssetsParams = {
  query?: string;
  page?: number;
  limit?: number;
  categoryId?: number;
  statusId?: number;
};

export const assetsQueryKey = ['assets'] as const;

export const assetsParamQueryKey = (params: AssetsParams) => [...assetsQueryKey, params] as const;

async function fetchAssets(params: AssetsParams): Promise<ListAssetsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);
  if (params.categoryId) searchParams.set('categoryId', String(params.categoryId));
  if (params.statusId) searchParams.set('statusId', String(params.statusId));

  const response = await fetch(`/api/v1/assets?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Assets');
  }

  return response.json() as Promise<ListAssetsResponse>;
}

export function useAssetsQuery(params: AssetsParams) {
  return useQuery({
    queryKey: assetsParamQueryKey(params),
    queryFn: () => fetchAssets(params),
  });
}
