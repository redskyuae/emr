'use client';

import { Suspense } from 'react';
import { Banknote, Boxes, Wrench, type LucideIcon } from 'lucide-react';

import { useSuspenseAssetSummary } from '@/app/queries/assets-management/assets-overview/useAssetSummary';
import type { AssetSummary } from '@/app/api/lib/modules/asset/schemas/asset-schema';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAedCompact } from '@/lib/format-currency';
import { WidgetErrorBoundary } from './widget-error-boundary';

type Stat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

type AssetStatCardsProps = {
  assetSummary: AssetSummary;
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

        <p className="text-3xl leading-none font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export function AssetStatCards({ assetSummary }: AssetStatCardsProps) {
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
  ];

  return (
    <>
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </>
  );
}

export function AssetStatCardsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((item) => (
        <Skeleton key={item} className="h-32 w-full" />
      ))}
    </>
  );
}

function AssetStatCardsContainer() {
  const { data: assetSummary } = useSuspenseAssetSummary();

  return <AssetStatCards assetSummary={assetSummary} />;
}

export function AssetStatCardsWidget() {
  return (
    <WidgetErrorBoundary title="Could not load Asset stats">
      <Suspense fallback={<AssetStatCardsSkeleton />}>
        <AssetStatCardsContainer />
      </Suspense>
    </WidgetErrorBoundary>
  );
}
