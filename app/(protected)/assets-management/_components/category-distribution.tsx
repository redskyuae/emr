'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { PiArrowRightLight, PiChartPieSliceDuotone } from 'react-icons/pi';

import { useSuspenseAssetSummary } from '@/app/queries/assets-management/assets-overview/useAssetSummary';
import type { AssetCategoryCount } from '@/app/api/lib/modules/asset/schemas/asset-schema';
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
import { WidgetErrorBoundary } from './widget-error-boundary';

type CategoryDistributionProps = {
  byCategory: AssetCategoryCount[];
};

function CategoryDistributionRow({
  category,
  maxCount,
}: {
  category: AssetCategoryCount;
  maxCount: number;
}) {
  const percentage = Math.max((category.count / maxCount) * 100, category.count ? 8 : 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: category.color }}
            aria-hidden="true"
          />
          <span className="truncate font-medium">{category.name}</span>
        </div>
        <span className="text-muted-foreground shrink-0 tabular-nums">{category.count}</span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: category.color }}
        />
      </div>
    </div>
  );
}

export function CategoryDistribution({ byCategory }: CategoryDistributionProps) {
  const maxCount = Math.max(...byCategory.map((category) => category.count), 1);

  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle>Assets by category</CardTitle>
          <CardDescription>Distribution across the estate</CardDescription>
        </div>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/assets-management/inventory">
              <span>Inventory</span>
              <PiArrowRightLight className="size-3.5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5 p-4">
        {byCategory.length === 0 ? (
          <EmptyState
            size="sm"
            tone="orange"
            icon={PiChartPieSliceDuotone}
            title="No Asset Categories yet"
            description="Create Asset Categories to see the distribution here."
          />
        ) : (
          byCategory.map((category) => (
            <CategoryDistributionRow
              key={category.categoryId}
              category={category}
              maxCount={maxCount}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function CategoryDistributionSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b">
        <div>
          <CardTitle>Assets by category</CardTitle>
          <CardDescription>Distribution across the estate</CardDescription>
        </div>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/assets-management/inventory">
              <span>Inventory</span>
              <PiArrowRightLight className="size-3.5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5 p-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="space-y-2">
            <div className="flex h-5 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-2.5 rounded-full" />
                <Skeleton className="h-3.5 w-28" />
              </div>
              <Skeleton className="h-3.5 w-6" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CategoryDistributionContainer() {
  const { data: assetSummary } = useSuspenseAssetSummary();

  return <CategoryDistribution byCategory={assetSummary.byCategory} />;
}

export function CategoryDistributionWidget() {
  return (
    <WidgetErrorBoundary title="Could not load Asset categories">
      <Suspense fallback={<CategoryDistributionSkeleton />}>
        <CategoryDistributionContainer />
      </Suspense>
    </WidgetErrorBoundary>
  );
}
