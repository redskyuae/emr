'use client';

import { Suspense } from 'react';
import { ClipboardList } from 'lucide-react';

import { useSuspenseWorkOrderSummary } from '@/app/queries/assets-management/assets-overview/useWorkOrderSummary';
import type { WorkOrderSummary } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WidgetErrorBoundary } from './widget-error-boundary';

type WorkOrderStatCardsProps = {
  workOrderSummary: WorkOrderSummary;
};

export function WorkOrderStatCards({ workOrderSummary }: WorkOrderStatCardsProps) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="flex min-h-32 flex-col justify-between gap-5 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-muted-foreground text-sm font-medium">Active work orders</p>
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
            <ClipboardList className="size-4" />
          </span>
        </div>

        <p className="text-3xl leading-none font-semibold tabular-nums">
          {workOrderSummary.activeCount.toLocaleString('en-US')}
        </p>
      </CardContent>
    </Card>
  );
}

export function WorkOrderStatCardsSkeleton() {
  return <Skeleton className="h-32 w-full" />;
}

function WorkOrderStatCardsContainer() {
  const { data: workOrderSummary } = useSuspenseWorkOrderSummary();

  return <WorkOrderStatCards workOrderSummary={workOrderSummary} />;
}

export function WorkOrderStatCardsWidget() {
  return (
    <WidgetErrorBoundary title="Could not load Work Order stats">
      <Suspense fallback={<WorkOrderStatCardsSkeleton />}>
        <WorkOrderStatCardsContainer />
      </Suspense>
    </WidgetErrorBoundary>
  );
}
