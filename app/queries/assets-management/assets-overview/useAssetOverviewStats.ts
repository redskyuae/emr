'use client';

import { useSuspenseQueries } from '@tanstack/react-query';

import { assetSummaryQueryOptions } from './useAssetSummary';
import { workOrderSummaryQueryOptions } from './useWorkOrderSummary';

export function useSuspenseAssetOverviewStats() {
  const [assetSummaryResult, workOrderSummaryResult] = useSuspenseQueries({
    queries: [assetSummaryQueryOptions, workOrderSummaryQueryOptions],
  });

  return {
    assetSummary: assetSummaryResult.data,
    workOrderSummary: workOrderSummaryResult.data,
  };
}
