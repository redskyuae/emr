'use client';

import { Suspense } from 'react';
import { useSuspenseQueries } from '@tanstack/react-query';
import { Banknote, Boxes, ClipboardList, Wrench, type LucideIcon } from 'lucide-react';

import { assetSummaryQueryOptions } from '@/app/queries/assets-management/assets-overview/useAssetSummary';
import { workOrderSummaryQueryOptions } from '@/app/queries/assets-management/assets-overview/useWorkOrderSummary';
import type { AssetSummary } from '@/app/api/lib/modules/asset/schemas/asset-schema';
import type { WorkOrderSummary } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAedCompact } from '@/lib/format-currency';
import { WidgetErrorBoundary } from './widget-error-boundary';

type Stat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

type StatCardsProps = {
  assetSummary: AssetSummary;
  workOrderSummary: WorkOrderSummary;
};

export function StatCards({ assetSummary, workOrderSummary }: StatCardsProps) {
  const stats: Stat[] = [
    {
      label: 'Total assets',
      value: assetSummary.totalAssets.toLocaleString('en-US'),
      icon: Boxes,
    },
    {
      label: 'Portfolio value',
      value: formatAedCompact(assetSummary.portfolioValue),
      icon: Banknote,
    },
    {
      label: 'Out of service',
      value: assetSummary.outOfServiceCount.toLocaleString('en-US'),
      icon: Wrench,
    },
    {
      label: 'Active work orders',
      value: workOrderSummary.activeCount.toLocaleString('en-US'),
      icon: ClipboardList,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="shadow-fluent-2">
          <CardContent className="flex min-h-32 flex-col justify-between gap-5 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
              <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
                <stat.icon className="size-4" />
              </span>
            </div>

            <p className="text-3xl leading-none font-semibold tabular-nums">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

export function StatCardsSkeleton() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-32 w-full" />
      ))}
    </section>
  );
}

function StatCardsContainer() {
  const [{ data: assetSummary }, { data: workOrderSummary }] = useSuspenseQueries({
    queries: [assetSummaryQueryOptions, workOrderSummaryQueryOptions],
  });

  return <StatCards assetSummary={assetSummary} workOrderSummary={workOrderSummary} />;
}

export function StatCardsWidget() {
  return (
    <WidgetErrorBoundary title="Could not load Asset overview stats">
      <Suspense fallback={<StatCardsSkeleton />}>
        <StatCardsContainer />
      </Suspense>
    </WidgetErrorBoundary>
  );
}
