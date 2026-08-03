
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { GetAssetSummaryResponse } from '@/app/api/v1/assets/summary/types';

export const assetSummaryQueryKey = ['asset-summary'] as const;

async function fetchAssetSummary(): Promise<GetAssetSummaryResponse> {
  const response = await fetch('/api/v1/assets/summary', {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Asset summary');
  }

  return response.json() as Promise<GetAssetSummaryResponse>;
}

export const assetSummaryQueryOptions = queryOptions({
  queryKey: assetSummaryQueryKey,
  queryFn: fetchAssetSummary,
  select: (response: GetAssetSummaryResponse) => response.data,
});

export function useSuspenseAssetSummary() {
  return useSuspenseQuery(assetSummaryQueryOptions);
}
