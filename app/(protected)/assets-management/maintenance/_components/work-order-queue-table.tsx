'use client';

import { AlertCircle, Search } from 'lucide-react';

import type {
  WorkOrder,
  WorkOrderMasterSummary,
} from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import type { Paginated } from '@/app/api/lib/utils/types';
import { getApiErrorMessage } from '@/app/queries/api-error';
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

type WorkOrderQueueTableProps = {
  workOrders: WorkOrder[];
  meta: Paginated<WorkOrder>['meta'] | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  hasActiveFilters: boolean;
  page: number;
  onPageChange: (next: number) => void;
};

function formatCreatedOn(value: Date | string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** dueDate is a date-only `YYYY-MM-DD` value; build the Date from its parts so
 * the displayed day never shifts across a UTC-vs-local boundary. */
function formatDueDate(value: string | null) {
  if (!value) {
    return '—';
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return '—';
  }

  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));

  return parsed.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function MasterBadge({ master }: { master: WorkOrderMasterSummary }) {
  return (
    <Badge variant="outline">
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: master.color }}
        aria-hidden="true"
      />
      {master.name}
    </Badge>
  );
}

function WorkOrderAsset({ workOrder }: { workOrder: WorkOrder }) {
  const assetLabel = workOrder.asset.model
    ? `${workOrder.asset.name} · ${workOrder.asset.model}`
    : workOrder.asset.name;

  return (
    <div className="max-w-sm min-w-72 space-y-1">
      <p className="truncate font-medium">{assetLabel}</p>
      {workOrder.note ? (
        <p className="text-muted-foreground truncate text-xs">{workOrder.note}</p>
      ) : null}
    </div>
  );
}

export function WorkOrderQueueTable({
  workOrders,
  meta,
  isLoading,
  isFetching,
  isError,
  error,
  hasActiveFilters,
  page,
  onPageChange,
}: WorkOrderQueueTableProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Could not load Work Orders</AlertTitle>
        <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <WorkOrderQueueTableSkeleton />;
  }

  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const pageSize = meta?.pageSize ?? 0;
  const rangeStart = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize, total);

  if (workOrders.length === 0) {
    return (
      <Empty className="bg-card shadow-fluent-2 min-h-72 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>No Work Orders found</EmptyTitle>
          <EmptyDescription>
            {hasActiveFilters
              ? 'Try a different search or type filter.'
              : 'Raise a Work Order to start tracking maintenance jobs.'}
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
            <TableHead className="pl-4">Work order</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Technician</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="pr-4">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workOrders.map((workOrder) => (
            <TableRow key={workOrder.id}>
              <TableCell className="pl-4 font-mono text-xs font-semibold">
                {workOrder.code}
              </TableCell>
              <TableCell className="py-3">
                <WorkOrderAsset workOrder={workOrder} />
              </TableCell>
              <TableCell className="text-muted-foreground">{workOrder.type.name}</TableCell>
              <TableCell>
                <MasterBadge master={workOrder.priority} />
              </TableCell>
              <TableCell className="text-muted-foreground min-w-40">
                {workOrder.technician || '—'}
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">
                {formatCreatedOn(workOrder.createdOn)}
              </TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">
                {formatDueDate(workOrder.dueDate)}
              </TableCell>
              <TableCell className="pr-4">
                <MasterBadge master={workOrder.status} />
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

function WorkOrderQueueTableSkeleton() {
  return (
    <Table className="min-w-max">
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Work order</TableHead>
          <TableHead>Asset</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Technician</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Due</TableHead>
          <TableHead className="pr-4">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }, (_, i) => (
          <TableRow key={i}>
            <TableCell className="pl-4">
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell className="py-3">
              <div className="min-w-72 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="pr-4">
              <Skeleton className="h-5 w-20 rounded-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
