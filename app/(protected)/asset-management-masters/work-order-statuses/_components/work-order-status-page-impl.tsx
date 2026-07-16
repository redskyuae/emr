'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
  Workflow,
} from 'lucide-react';
import type { WorkOrderStatus } from '@/app/api/lib/modules/work-order-status/schemas/work-order-status-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useWorkOrderStatusQuery } from '@/app/queries/asset-masters/work-order-statuses/useWorkOrderStatus';
import { useWorkOrderStatusesQuery } from '@/app/queries/asset-masters/work-order-statuses/useWorkOrderStatuses';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { WorkOrderStatusDeleteDialog } from './_modals/work-order-status-delete-dialog';
import { WorkOrderStatusFormSheet } from './_sheets/work-order-status-form-sheet';
import { ViewSkeleton } from './work-order-status-skeletons';
import {
  WorkOrderStatusCardView,
  WorkOrderStatusListView,
  WorkOrderStatusTableView,
} from './work-order-status-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function WorkOrderStatusPageImpl() {
  const [statusParam, setStatusParam] = useQueryState('work-order-status');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [statusPendingDelete, setStatusPendingDelete] = useState<WorkOrderStatus | null>(null);

  const isCreating = statusParam === 'new';
  const editingStatusId =
    statusParam !== null && statusParam !== 'new' && /^\d+$/.test(statusParam)
      ? Number(statusParam)
      : null;

  const statusesQuery = useWorkOrderStatusesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const statuses = statusesQuery.data?.data ?? [];
  const meta = statusesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingStatusFromList =
    editingStatusId !== null ? (statuses.find((s) => s.id === editingStatusId) ?? null) : null;

  const shouldFetchEditingStatus =
    editingStatusId !== null && !statusesQuery.isLoading && editingStatusFromList === null;
  const editingStatusQuery = useWorkOrderStatusQuery(
    shouldFetchEditingStatus ? editingStatusId : null
  );
  const editingStatus = editingStatusFromList ?? editingStatusQuery.data ?? null;

  const statusResolving =
    editingStatusId !== null &&
    editingStatus === null &&
    (statusesQuery.isLoading || editingStatusQuery.isFetching);
  const sheetOpen =
    isCreating || (editingStatusId !== null && (statusResolving || editingStatus !== null));

  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  if (prevSearch !== debouncedSearch) {
    setPrevSearch(debouncedSearch);
    if (page !== 1) setPage(1);
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="shadow-fluent-2">
          <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
            <ToggleGroup
              type="single"
              value={viewLayout}
              onValueChange={(value) => {
                if (value) setViewLayout(value as ViewLayout);
              }}
              variant="outline"
              size="lg"
              spacing={0}
            >
              <ToggleGroupItem value="table" aria-label="Table view">
                <TableIcon className="size-4" />
                Table
              </ToggleGroupItem>
              <ToggleGroupItem value="card" aria-label="Card view">
                <LayoutGrid className="size-4" />
                Card
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <LayoutList className="size-4" />
                List
              </ToggleGroupItem>
            </ToggleGroup>

            <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-sm">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search work order statuses..."
                aria-label="Search work order statuses"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={() => void setStatusParam('new')}>
                <Plus className="size-4" />
                Add Work Order Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {statusesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Work Order Statuses</AlertTitle>
            <AlertDescription>{getApiErrorMessage(statusesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {statusesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : statusesQuery.isError ? null : statuses.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Workflow />
              </EmptyMedia>
              <EmptyTitle>No Work Order Statuses yet</EmptyTitle>
              <EmptyDescription>
                Create Work Order Statuses to track the lifecycle state of Work Orders in this
                Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setStatusParam('new')}>
                <Plus className="size-4" />
                Add Work Order Status
              </Button>
            </EmptyContent>
          </Empty>
        ) : statuses.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Work Order Statuses match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <WorkOrderStatusTableView
                statuses={statuses}
                onEdit={(status) => void setStatusParam(String(status.id))}
                onDelete={setStatusPendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <WorkOrderStatusCardView
                statuses={statuses}
                onEdit={(status) => void setStatusParam(String(status.id))}
                onDelete={setStatusPendingDelete}
              />
            ) : (
              <WorkOrderStatusListView
                statuses={statuses}
                onEdit={(status) => void setStatusParam(String(status.id))}
                onDelete={setStatusPendingDelete}
              />
            )}

            {totalPages > 0 ? (
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-muted-foreground text-sm">
                  Showing {rangeStart}&ndash;{rangeEnd} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <WorkOrderStatusFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        statusId={editingStatusId}
        status={editingStatus}
        isResolving={statusResolving}
        onClose={() => void setStatusParam(null)}
      />

      <WorkOrderStatusDeleteDialog
        status={statusPendingDelete}
        onClose={() => setStatusPendingDelete(null)}
        onDeleted={(deletedId) => {
          if (editingStatusId === deletedId) {
            void setStatusParam(null);
          }
          if (statuses.length === 1 && page > 1) {
            setPage((p) => p - 1);
          }
        }}
      />
    </>
  );
}
