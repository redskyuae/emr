'use client';

import { Suspense } from 'react';
import { PiClipboardTextLight } from 'react-icons/pi';

import { useSuspenseWorkOrderSummary } from '@/app/queries/assets-management/assets-overview/useWorkOrderSummary';
import type { WorkOrderSummary } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import { StatCard, StatCardSkeleton } from '@/components/app/stat-card';
import { WidgetErrorBoundary } from './widget-error-boundary';

type WorkOrderStatCardsProps = {
  workOrderSummary: WorkOrderSummary;
};

export function WorkOrderStatCards({ workOrderSummary }: WorkOrderStatCardsProps) {
  return (
    <StatCard
      label="Active work orders"
      value={workOrderSummary.activeCount.toLocaleString('en-US')}
      icon={PiClipboardTextLight}
    />
  );
}

function WorkOrderStatCardsContainer() {
  const { data: workOrderSummary } = useSuspenseWorkOrderSummary();

  return <WorkOrderStatCards workOrderSummary={workOrderSummary} />;
}

export function WorkOrderStatCardsWidget() {
  return (
    <WidgetErrorBoundary title="Could not load Work Order stats">
      <Suspense fallback={<StatCardSkeleton />}>
        <WorkOrderStatCardsContainer />
      </Suspense>
    </WidgetErrorBoundary>
  );
}
