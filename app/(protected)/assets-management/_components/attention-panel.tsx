import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { cn } from '@/lib/utils';

type AttentionPanelProps = {
  workOrders: WorkOrder[];
  totalCount: number;
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

export function AttentionPanel({ workOrders, totalCount }: AttentionPanelProps) {
  const remainingCount = totalCount - workOrders.length;

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div>
          <CardTitle>Attention required</CardTitle>
          <CardDescription>Overdue &amp; critical items</CardDescription>
        </div>
        {remainingCount > 0 ? (
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link href="/assets-management/maintenance">
                <span>View {remainingCount} more</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="divide-y p-0">
        {workOrders.length === 0 ? (
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
