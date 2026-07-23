'use client';

import { useAssetSummaryQuery } from '@/app/queries/assets-management/assets-overview/useAssetSummary';
import {
  useAttentionWorkOrdersQuery,
  useUpcomingMaintenanceWorkOrdersQuery,
} from '@/app/queries/assets-management/assets-overview/useWorkOrders';
import { useWorkOrderSummaryQuery } from '@/app/queries/assets-management/assets-overview/useWorkOrderSummary';
import { AttentionPanel } from './attention-panel';
import { CategoryDistribution } from './category-distribution';
import { StatCards } from './stat-cards';
import { UpcomingMaintenanceTable } from './upcoming-maintenance-table';

const WORK_ORDERS_PARAMS = { limit: 999 };

export function OverviewPageImpl() {
  const assetSummaryQuery = useAssetSummaryQuery();
  const workOrderSummaryQuery = useWorkOrderSummaryQuery();
  const attentionQuery = useAttentionWorkOrdersQuery(WORK_ORDERS_PARAMS);
  const upcomingQuery = useUpcomingMaintenanceWorkOrdersQuery(WORK_ORDERS_PARAMS);

  return (
    <div className="space-y-6">
      <StatCards
        assetSummary={assetSummaryQuery.data}
        workOrderSummary={workOrderSummaryQuery.data}
        isLoading={assetSummaryQuery.isLoading || workOrderSummaryQuery.isLoading}
        isError={assetSummaryQuery.isError || workOrderSummaryQuery.isError}
        error={assetSummaryQuery.error ?? workOrderSummaryQuery.error}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <CategoryDistribution
          byCategory={assetSummaryQuery.data?.byCategory}
          isLoading={assetSummaryQuery.isLoading}
          isError={assetSummaryQuery.isError}
          error={assetSummaryQuery.error}
        />

        <AttentionPanel
          workOrders={attentionQuery.data}
          isLoading={attentionQuery.isLoading}
          isError={attentionQuery.isError}
          error={attentionQuery.error}
        />
      </section>

      <UpcomingMaintenanceTable
        workOrders={upcomingQuery.data}
        isLoading={upcomingQuery.isLoading}
        isError={upcomingQuery.isError}
        error={upcomingQuery.error}
      />
    </div>
  );
}
