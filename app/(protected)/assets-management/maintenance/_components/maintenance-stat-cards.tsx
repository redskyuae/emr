'use client';

import { Suspense } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, type LucideIcon, Wrench } from 'lucide-react';

import { useSuspenseWorkOrderSummary } from '@/app/queries/assets-management/assets-overview/useWorkOrderSummary';
import type { WorkOrderSummary } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WidgetErrorBoundary } from '@/app/(protected)/assets-management/_components/widget-error-boundary';

type Stat = {
  label: string;
  value: number;
  icon: LucideIcon;
};

type MaintenanceStatCardsProps = {
  workOrderSummary: WorkOrderSummary;
};

function StatCard({ label, value, icon: Icon }: Stat) {
  return (
    <Card className="shadow-fluent-2">
      <CardContent className="flex min-h-32 flex-col justify-between gap-5 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
            <Icon className="size-4" />
          </span>
        </div>

        <p className="text-3xl leading-none font-semibold tabular-nums">
          {value.toLocaleString('en-US')}
        </p>
      </CardContent>
    </Card>
  );
}

export function MaintenanceStatCards({ workOrderSummary }: MaintenanceStatCardsProps) {
  const stats: Stat[] = [
    {
      label: 'Active work orders',
      value: workOrderSummary.activeCount,
      icon: Wrench,
    },
    {
      label: 'Due next 7 days',
      value: workOrderSummary.dueNext7DaysCount,
      icon: CalendarClock,
    },
    {
      label: 'Overdue',
      value: workOrderSummary.overdueCount,
      icon: AlertTriangle,
    },
    {
      label: 'Completed (30d)',
      value: workOrderSummary.completedLast30dCount,
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </section>
  );
}

export function MaintenanceStatCardsSkeleton() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-32 w-full" />
      ))}
    </section>
  );
}

function MaintenanceStatCardsContainer() {
  const { data: workOrderSummary } = useSuspenseWorkOrderSummary();

  return <MaintenanceStatCards workOrderSummary={workOrderSummary} />;
}

export function MaintenanceStatCardsWidget() {
  return (
    <WidgetErrorBoundary title="Could not load Work Order stats">
      <Suspense fallback={<MaintenanceStatCardsSkeleton />}>
        <MaintenanceStatCardsContainer />
      </Suspense>
    </WidgetErrorBoundary>
  );
}
