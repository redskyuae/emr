'use client';

import { useAssetSummary } from '@/app/queries/assets-management/assets-overview/useAssetSummary';
import {
  useAttentionWorkOrders,
  useUpcomingMaintenanceWorkOrders,
} from '@/app/queries/assets-management/assets-overview/useWorkOrders';
import { useWorkOrderSummary } from '@/app/queries/assets-management/assets-overview/useWorkOrderSummary';
import { AttentionPanel } from './attention-panel';
import { CategoryDistribution } from './category-distribution';
import { StatCards } from './stat-cards';
import { UpcomingMaintenanceTable } from './upcoming-maintenance-table';

const WORK_ORDERS_PARAMS = { limit: 999 };

export function OverviewContent() {
  const { data: assetSummary } = useAssetSummary();
  const { data: workOrderSummary } = useWorkOrderSummary();
  const attentionQuery = useAttentionWorkOrders(WORK_ORDERS_PARAMS);
  const upcomingQuery = useUpcomingMaintenanceWorkOrders(WORK_ORDERS_PARAMS);

  return (
    <div className="space-y-6">
      <StatCards assetSummary={assetSummary} workOrderSummary={workOrderSummary} />

      <section className="grid gap-4 xl:grid-cols-2">
        <CategoryDistribution byCategory={assetSummary.byCategory} />

        <AttentionPanel
          workOrders={attentionQuery.data.items}
          totalCount={attentionQuery.data.total}
        />
      </section>

      <UpcomingMaintenanceTable workOrders={upcomingQuery.data} />
    </div>
  );
}
