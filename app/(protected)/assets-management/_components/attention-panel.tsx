'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { CiWarning } from 'react-icons/ci';
import { PiArrowRightLight, PiCheckCircleDuotone } from 'react-icons/pi';

import { useSuspenseAttentionWorkOrders } from '@/app/queries/assets-management/assets-overview/useWorkOrders';
import type { WorkOrder } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/app/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { WidgetErrorBoundary } from './widget-error-boundary';

type AttentionPanelProps = {
  workOrders: WorkOrder[];
};

function AttentionRow({ workOrder }: { workOrder: WorkOrder }) {
  const isCritical = workOrder.priority.name.toLowerCase() === 'critical';

  return (
    <div className="flex items-start gap-3 p-4">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-md',
          isCritical ? 'bg-destructive/10 text-destructive' : 'bg-chart-5/10 text-chart-5'
        )}
      >
        <CiWarning className="size-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 font-medium">{workOrder.asset.name}</p>
          <span
            className={cn(
              'shrink-0 font-mono text-xs',
              isCritical ? 'text-destructive' : 'text-chart-5'
            )}
          >
            {workOrder.code}
          </span>
        </div>
        {workOrder.note ? (
          <p className="text-muted-foreground text-sm leading-5">{workOrder.note}</p>
        ) : null}
      </div>
    </div>
  );
}

export function AttentionPanel({ workOrders }: AttentionPanelProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle>Attention required</CardTitle>
          <CardDescription>Overdue &amp; critical items</CardDescription>
        </div>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/assets-management/maintenance">
              <span>All work orders</span>
              <PiArrowRightLight className="size-3.5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {workOrders.length === 0 ? (
          // An all-clear, so the one green empty state on the overview.
          <EmptyState
            size="sm"
            tone="green"
            icon={PiCheckCircleDuotone}
            title="Nothing needs attention"
            description="No overdue or critical Work Orders right now."
          />
        ) : (
          workOrders.map((workOrder) => <AttentionRow key={workOrder.id} workOrder={workOrder} />)
        )}
      </CardContent>
    </Card>
  );
}

// Mirrors the loaded panel: the same header and action, then one row per Work Order with its
// warning tile, Asset name, code and note.
export function AttentionPanelSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle>Attention required</CardTitle>
          <CardDescription>Overdue &amp; critical items</CardDescription>
        </div>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/assets-management/maintenance">
              <span>All work orders</span>
              <PiArrowRightLight className="size-3.5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex items-start gap-3 p-4">
            <Skeleton className="size-9 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-6 items-center">
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex h-4 items-center">
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="flex h-5 items-center">
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AttentionPanelContainer() {
  const { data } = useSuspenseAttentionWorkOrders();

  return <AttentionPanel workOrders={data} />;
}

export function AttentionPanelWidget() {
  return (
    <WidgetErrorBoundary title="Could not load Work Orders">
      <Suspense fallback={<AttentionPanelSkeleton />}>
        <AttentionPanelContainer />
      </Suspense>
    </WidgetErrorBoundary>
  );
}
