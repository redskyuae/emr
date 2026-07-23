import { AlertCircle, AlertTriangle } from 'lucide-react';

import type { WorkOrder } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type AttentionPanelProps = {
  workOrders: WorkOrder[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
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
        <AlertTriangle className="size-4" />
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

export function AttentionPanel({ workOrders, isLoading, isError, error }: AttentionPanelProps) {
  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div>
          <CardTitle>Attention required</CardTitle>
          <CardDescription>Overdue &amp; critical items</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {isError ? (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Work Orders</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : isLoading || !workOrders ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-14 w-full" />
            ))}
          </div>
        ) : workOrders.length === 0 ? (
          <Empty className="min-h-40 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <AlertTriangle className="size-5" />
              </EmptyMedia>
              <EmptyTitle>Nothing needs attention</EmptyTitle>
              <EmptyDescription>No overdue or critical Work Orders right now.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          workOrders.map((workOrder) => <AttentionRow key={workOrder.id} workOrder={workOrder} />)
        )}
      </CardContent>
    </Card>
  );
}
