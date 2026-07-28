'use client';

import { Suspense } from 'react';

import {
  ALL_WORK_ORDERS_PARAMS,
  useSuspenseUpcomingMaintenanceWorkOrders,
} from '@/app/queries/assets-management/assets-overview/useWorkOrders';
import { UpcomingMaintenanceTable } from './upcoming-maintenance-table';
import { UpcomingMaintenanceTableSkeleton } from './upcoming-maintenance-table-skeleton';
import { WidgetErrorBoundary } from './widget-error-boundary';

function UpcomingMaintenanceTableContainer() {
  const { data } = useSuspenseUpcomingMaintenanceWorkOrders(ALL_WORK_ORDERS_PARAMS);

  return <UpcomingMaintenanceTable workOrders={data} />;
}

export function UpcomingMaintenanceTableWidget() {
  return (
    <WidgetErrorBoundary title="Could not load Work Orders">
      <Suspense fallback={<UpcomingMaintenanceTableSkeleton />}>
        <UpcomingMaintenanceTableContainer />
      </Suspense>
    </WidgetErrorBoundary>
  );
}
