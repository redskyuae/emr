'use client';

import { AlertCircle, Boxes, Search } from 'lucide-react';

import type { Asset, AssetMasterSummary } from '@/app/api/lib/modules/asset/schemas/asset-schema';
import type { Paginated } from '@/app/api/lib/utils/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { formatAedCompact } from '@/app/(protected)/assets-management/mock-data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type AssetDirectoryTableProps = {
  assets: Asset[];
  meta: Paginated<Asset>['meta'] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  hasActiveFilters: boolean;
  page: number;
  onPageChange: (next: number) => void;
};

function formatAssetValue(value: number | null) {
  if (value === null || value === 0) {
    return '—';
  }

  return formatAedCompact(value);
}

function CategoryLabel({ category }: { category: AssetMasterSummary }) {
  return (
    <div className="flex min-w-40 items-center gap-2">
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: category.color }}
        aria-hidden="true"
      />
      <span className="font-medium">{category.name}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: AssetMasterSummary }) {
  return (
    <Badge variant="outline">
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: status.color }}
        aria-hidden="true"
      />
      {status.name}
    </Badge>
  );
}

function AssetIdentity({ asset }: { asset: Asset }) {
  return (
    <div className="flex min-w-64 items-center gap-3">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: asset.category.color + '1a', color: asset.category.color }}
        aria-hidden="true"
      >
        <Boxes className="size-4" />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="truncate font-semibold">{asset.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          <span className="font-mono">{asset.serialNumber}</span>
          {asset.manufacturer ? (
            <>
              <span aria-hidden="true"> · </span>
              {asset.manufacturer}
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

function AssignedTo({ asset }: { asset: Asset }) {
  if (!asset.custodian) {
    return <span className="text-muted-foreground italic">Unassigned</span>;
  }

  return (
    <div className="min-w-36 space-y-1">
      <p className="font-medium">{asset.custodian}</p>
      {asset.department ? (
        <p className="text-muted-foreground text-xs">{asset.department}</p>
      ) : null}
    </div>
  );
}

export function AssetDirectoryTable({
  assets,
  meta,
  isLoading,
  isFetching,
  isError,
  error,
  hasActiveFilters,
  page,
  onPageChange,
}: AssetDirectoryTableProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load Assets</AlertTitle>
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const pageSize = meta?.pageSize ?? 0;
  const rangeStart = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize, total);

  if (isLoading) {
    return <AssetDirectoryTableSkeleton />;
  }

  if (assets.length === 0) {
    return (
      <Empty className="bg-card shadow-fluent-2 min-h-72 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>No assets found</EmptyTitle>
          <EmptyDescription>
            {hasActiveFilters
              ? 'Try a different search, category, or status.'
              : 'Add an Asset to start tracking your equipment inventory.'}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <Table className={cn('min-w-max', isFetching && 'opacity-70 transition-opacity')}>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Asset</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Assigned to</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Next service</TableHead>
            <TableHead className="pr-4">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="py-3 pl-4">
                <AssetIdentity asset={asset} />
              </TableCell>
              <TableCell>
                <CategoryLabel category={asset.category} />
              </TableCell>
              <TableCell className="text-muted-foreground min-w-52">
                {asset.location || '—'}
              </TableCell>
              <TableCell>
                <AssignedTo asset={asset} />
              </TableCell>
              <TableCell>
                <StatusBadge status={asset.status} />
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">
                {asset.nextServiceDate || '—'}
              </TableCell>
              <TableCell className="pr-4 font-medium tabular-nums">
                {formatAssetValue(asset.currentValue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 border-t p-3 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            Showing {rangeStart}&ndash;{rangeEnd} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isFetching}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function AssetDirectoryTableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <Skeleton key={item} className="h-12 w-full" />
      ))}
    </div>
  );
}
