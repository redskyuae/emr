'use client';

import { Suspense } from 'react';
import type { IconType } from 'react-icons';
import { CiCalendarDate, CiCircleCheck, CiWarning } from 'react-icons/ci';
import { PiWrenchLight } from 'react-icons/pi';

import { useSuspenseWorkOrderSummary } from '@/app/queries/assets-management/assets-overview/useWorkOrderSummary';
import type { WorkOrderSummary } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import { StatCard, StatCardSkeleton, type StatTone } from '@/components/app/stat-card';
import { WidgetErrorBoundary } from '@/app/(protected)/assets-management/_components/widget-error-boundary';

type Stat = {
  label: string;
  value: number;
  icon: IconType;
  tone?: StatTone;
};

type MaintenanceStatCardsProps = {
  workOrderSummary: WorkOrderSummary;
};

export function MaintenanceStatCards({ workOrderSummary }: MaintenanceStatCardsProps) {
  const stats: Stat[] = [
    {
      label: 'Active work orders',
      value: workOrderSummary.activeCount,
      icon: PiWrenchLight,
    },
    {
      label: 'Due next 7 days',
      value: workOrderSummary.dueNext7DaysCount,
      icon: CiCalendarDate,
      tone: 'warning',
    },
    {
      label: 'Overdue',
      value: workOrderSummary.overdueCount,
      icon: CiWarning,
      tone: 'destructive',
    },
    {
      label: 'Completed (30d)',
      value: workOrderSummary.completedLast30dCount,
      icon: CiCircleCheck,
      tone: 'success',
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value.toLocaleString('en-US')}
          icon={stat.icon}
          tone={stat.tone}
        />
      ))}
    </section>
  );
}

export function MaintenanceStatCardsSkeleton() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <StatCardSkeleton key={item} />
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
