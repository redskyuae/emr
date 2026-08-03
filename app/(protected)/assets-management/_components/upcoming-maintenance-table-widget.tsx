'use client';

import { Suspense } from 'react';

import { useSuspenseUpcomingMaintenanceWorkOrders } from '@/app/queries/assets-management/assets-overview/useWorkOrders';
import { UpcomingMaintenanceTable } from './upcoming-maintenance-table';
import { UpcomingMaintenanceTableSkeleton } from './upcoming-maintenance-table-skeleton';
import { WidgetErrorBoundary } from './widget-error-boundary';

function UpcomingMaintenanceTableContainer() {
  const { data } = useSuspenseUpcomingMaintenanceWorkOrders();

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
