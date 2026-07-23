import Link from 'next/link';
import { AlertCircle, ArrowRight, Boxes } from 'lucide-react';

import type { AssetCategoryCount } from '@/app/api/lib/modules/asset/schemas/asset-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Skeleton } from '@/components/ui/skeleton';

type CategoryDistributionProps = {
  byCategory: AssetCategoryCount[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
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

export function CategoryDistribution({
  byCategory,
  isLoading,
  isError,
  error,
}: CategoryDistributionProps) {
  const maxCount = Math.max(...(byCategory ?? []).map((category) => category.count), 1);

  return (
    <Card className="shadow-fluent-2">
      <CardHeader className="border-b">
        <div>
          <CardTitle>Assets by category</CardTitle>
          <CardDescription>Distribution across the estate</CardDescription>
        </div>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/assets-management/inventory">
              <span>Inventory</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5 p-4">
        {isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Asset categories</AlertTitle>
            <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
          </Alert>
        ) : isLoading || !byCategory ? (
          <div className="space-y-5">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-10 w-full" />
            ))}
          </div>
        ) : byCategory.length === 0 ? (
          <Empty className="min-h-40 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Boxes className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No Asset Categories yet</EmptyTitle>
              <EmptyDescription>
                Create Asset Categories to see the distribution here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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
