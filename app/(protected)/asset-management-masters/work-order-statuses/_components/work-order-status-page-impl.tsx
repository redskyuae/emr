'use client';

import { useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { CiBoxList, CiCircleAlert, CiGrid41, CiSearch, CiViewTable } from 'react-icons/ci';
import { PiCaretLeftLight, PiCaretRightLight, PiFlowArrowLight, PiPlusLight } from 'react-icons/pi';
import type { WorkOrderStatus } from '@/app/api/lib/modules/work-order-status/schemas/work-order-status-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useWorkOrderStatusQuery } from '@/app/queries/asset-masters/work-order-statuses/useWorkOrderStatus';
import { useWorkOrderStatusesQuery } from '@/app/queries/asset-masters/work-order-statuses/useWorkOrderStatuses';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
import { SkeletonCrossfade } from '@/components/app/skeleton-crossfade';
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

  const { data: canCreate, isLoading: canCreateLoading } = useHasPermission(
    'work-order-status:create'
  );
  const { data: canUpdate, isLoading: canUpdateLoading } = useHasPermission(
    'work-order-status:update'
  );
  const { data: canDelete } = useHasPermission('work-order-status:delete');

  const isCreating = statusParam === 'new' && canCreate;
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
    isCreating ||
    (canUpdate && editingStatusId !== null && (statusResolving || editingStatus !== null));

  const statusAccessDenied =
    (statusParam === 'new' && !canCreateLoading && !canCreate) ||
    (editingStatusId !== null && !canUpdateLoading && !canUpdate);

  useEffect(() => {
    if (statusAccessDenied) {
      void setStatusParam(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusAccessDenied]);

  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  if (prevSearch !== debouncedSearch) {
    setPrevSearch(debouncedSearch);
    if (page !== 1) setPage(1);
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
                <CiViewTable className="size-4" />
                Table
              </ToggleGroupItem>
              <ToggleGroupItem value="card" aria-label="Card view">
                <CiGrid41 className="size-4" />
                Card
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <CiBoxList className="size-4" />
                List
              </ToggleGroupItem>
            </ToggleGroup>

            <InputGroup className="lg:max-w-sm">
              <InputGroupAddon>
                <CiSearch className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search work order statuses..."
                aria-label="Search work order statuses"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" size="lg" onClick={() => void setStatusParam('new')}>
                  <PiPlusLight className="size-4" />
                  Add Work Order Status
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {statusesQuery.isError ? (
          <Alert variant="destructive">
            <CiCircleAlert className="size-4" />
            <AlertTitle>Could not load Work Order Statuses</AlertTitle>
            <AlertDescription>{getApiErrorMessage(statusesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {statusesQuery.isError ? null : (
          <SkeletonCrossfade
            isLoading={statusesQuery.isLoading}
            skeleton={
              <ViewSkeleton
                layout={viewLayout}
                canEdit={Boolean(canUpdate)}
                canDelete={Boolean(canDelete)}
              />
            }
          >
            {statuses.length === 0 && !debouncedSearch ? (
              <Empty className="bg-card min-h-80 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PiFlowArrowLight />
                  </EmptyMedia>
                  <EmptyTitle>No Work Order Statuses yet</EmptyTitle>
                  <EmptyDescription>
                    Create Work Order Statuses to track the lifecycle state of Work Orders in this
                    Tenant.
                  </EmptyDescription>
                </EmptyHeader>
                {canCreate ? (
                  <EmptyContent>
                    <Button type="button" onClick={() => void setStatusParam('new')}>
                      <PiPlusLight className="size-4" />
                      Add Work Order Status
                    </Button>
                  </EmptyContent>
                ) : null}
              </Empty>
            ) : statuses.length === 0 && debouncedSearch ? (
              <Empty className="bg-card min-h-72 border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CiSearch />
                  </EmptyMedia>
                  <EmptyTitle>No results found</EmptyTitle>
                  <EmptyDescription>
                    No Work Order Statuses match &ldquo;{debouncedSearch}&rdquo;. Try a different
                    search term.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-4">
                {viewLayout === 'table' ? (
                  <WorkOrderStatusTableView
                    statuses={statuses}
                    canEdit={canUpdate}
                    canDelete={canDelete}
                    onEdit={(status) => void setStatusParam(String(status.id))}
                    onDelete={setStatusPendingDelete}
                  />
                ) : viewLayout === 'card' ? (
                  <WorkOrderStatusCardView
                    statuses={statuses}
                    canEdit={canUpdate}
                    canDelete={canDelete}
                    onEdit={(status) => void setStatusParam(String(status.id))}
                    onDelete={setStatusPendingDelete}
                  />
                ) : (
                  <WorkOrderStatusListView
                    statuses={statuses}
                    canEdit={canUpdate}
                    canDelete={canDelete}
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
                        <PiCaretLeftLight className="size-4" />
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
                        <PiCaretRightLight className="size-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </SkeletonCrossfade>
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
        status={canDelete ? statusPendingDelete : null}
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
