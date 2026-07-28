'use client';

import { useSuspenseQueries } from '@tanstack/react-query';

import { assetSummaryQueryOptions } from '@/app/queries/assets-management/assets-overview/useAssetSummary';
import {
  attentionWorkOrdersQueryOptions,
  upcomingMaintenanceWorkOrdersQueryOptions,
} from '@/app/queries/assets-management/assets-overview/useWorkOrders';
import { workOrderSummaryQueryOptions } from '@/app/queries/assets-management/assets-overview/useWorkOrderSummary';
import { AttentionPanel } from './attention-panel';
import { CategoryDistribution } from './category-distribution';
import { StatCards } from './stat-cards';
import { UpcomingMaintenanceTable } from './upcoming-maintenance-table';

const WORK_ORDERS_PARAMS = { limit: 999 };

export function OverviewContent() {
  const [assetSummaryResult, workOrderSummaryResult, attentionResult, upcomingResult] =
    useSuspenseQueries({
      queries: [
        assetSummaryQueryOptions,
        workOrderSummaryQueryOptions,
        attentionWorkOrdersQueryOptions(WORK_ORDERS_PARAMS),
        upcomingMaintenanceWorkOrdersQueryOptions(WORK_ORDERS_PARAMS),
      ],
    });

  return (
    <div className="space-y-6">
      <StatCards
        assetSummary={assetSummaryResult.data}
        workOrderSummary={workOrderSummaryResult.data}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <CategoryDistribution byCategory={assetSummaryResult.data.byCategory} />

        <AttentionPanel
          workOrders={attentionResult.data.items}
          totalCount={attentionResult.data.total}
        />
      </section>

      <UpcomingMaintenanceTable workOrders={upcomingResult.data} />
    </div>
  );
}
