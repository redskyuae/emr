'use client';

import { Suspense } from 'react';
import type { IconType } from 'react-icons';
import { CiBoxes, CiMoneyBill } from 'react-icons/ci';
import { PiWrenchLight } from 'react-icons/pi';

import { useSuspenseAssetSummary } from '@/app/queries/assets-management/assets-overview/useAssetSummary';
import type { AssetSummary } from '@/app/api/lib/modules/asset/schemas/asset-schema';
import { StatCard, StatCardSkeleton, type StatTone } from '@/components/app/stat-card';
import { formatAedCompact } from '@/lib/format-currency';
import { WidgetErrorBoundary } from './widget-error-boundary';

type Stat = {
  label: string;
  value: string;
  icon: IconType;
  tone?: StatTone;
};

type AssetStatCardsProps = {
  assetSummary: AssetSummary;
};

export function AssetStatCards({ assetSummary }: AssetStatCardsProps) {
  const stats: Stat[] = [
    {
      label: 'Total assets',
      value: assetSummary.totalAssets.toLocaleString('en-US'),
      icon: CiBoxes,
    },
    {
      label: 'Portfolio value',
      value: formatAedCompact(assetSummary.portfolioValue),
      icon: CiMoneyBill,
    },
    {
      label: 'Out of service',
      value: assetSummary.outOfServiceCount.toLocaleString('en-US'),
      icon: PiWrenchLight,
      tone: 'warning',
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
        <StatCardSkeleton key={item} />
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
