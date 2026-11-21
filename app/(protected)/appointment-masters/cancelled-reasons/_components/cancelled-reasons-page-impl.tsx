'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useQueryState } from 'nuqs';
import {
  CiBoxList,
  CiCircleAlert,
  CiCircleRemove,
  CiGrid41,
  CiSearch,
  CiViewTable,
} from 'react-icons/ci';
import { PiCaretLeftLight, PiCaretRightLight, PiPlusLight } from 'react-icons/pi';
import type { AppointmentCancelledReason } from '@/app/api/lib/modules/appointment-cancelled-reason/schemas/appointment-cancelled-reason-schema';
import { ApiError, getApiErrorMessage } from '@/app/queries/api-error';
import { useAppointmentCancelledReasonQuery } from '@/app/queries/appointment-masters/cancelled-reasons/useAppointmentCancelledReason';
import { useAppointmentCancelledReasonsQuery } from '@/app/queries/appointment-masters/cancelled-reasons/useAppointmentCancelledReasons';
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
import { DeleteCancelledReasonDialog } from './_modals/delete-cancelled-reason-dialog';
import { CancelledReasonFormSheet } from './_sheets/cancelled-reason-form-sheet';
import { ViewSkeleton } from './cancelled-reason-skeletons';
import {
  CancelledReasonCardView,
  CancelledReasonListView,
  CancelledReasonTableView,
} from './cancelled-reason-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function CancelledReasonsPageImpl() {
  const [reasonParam, setReasonParam] = useQueryState('reason');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const [reasonPendingDelete, setReasonPendingDelete] = useState<AppointmentCancelledReason | null>(
    null
  );

  const reasonsQuery = useAppointmentCancelledReasonsQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const { data: canCreate } = useHasPermission('appointment-cancelled-reason:create');
  const { data: canUpdate } = useHasPermission('appointment-cancelled-reason:update');
  const { data: canDelete } = useHasPermission('appointment-cancelled-reason:delete');

  const reasons = reasonsQuery.data?.data ?? [];
  const meta = reasonsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const isCreating = reasonParam === 'new' && canCreate;
  const editingReasonId =
    reasonParam !== null && reasonParam !== 'new' && /^\d+$/.test(reasonParam)
      ? Number(reasonParam)
      : null;
  const editingReasonFromList =
    editingReasonId !== null
      ? (reasons.find((reason) => reason.id === editingReasonId) ?? null)
      : null;

  const shouldFetchEditingReason =
    editingReasonId !== null && !reasonsQuery.isLoading && editingReasonFromList === null;
  const editingReasonQuery = useAppointmentCancelledReasonQuery(
    shouldFetchEditingReason ? editingReasonId : null
  );
  const editingReason = editingReasonFromList ?? editingReasonQuery.data ?? null;

  const editingReasonResolving =
    editingReasonId !== null &&
    editingReason === null &&
    (reasonsQuery.isLoading || editingReasonQuery.isFetching);

  const editingReasonNotFound =
    editingReasonQuery.isError &&
    editingReasonQuery.error instanceof ApiError &&
    editingReasonQuery.error.status === 404;
  const editingReasonLoadFailed = editingReasonQuery.isError && !editingReasonNotFound;

  const sheetOpen =
    isCreating ||
    (editingReasonId !== null &&
      (editingReasonResolving || editingReason !== null || editingReasonLoadFailed));

  const previousDebouncedRef = useRef(debouncedSearch);
  useEffect(() => {
    if (previousDebouncedRef.current !== debouncedSearch) {
      previousDebouncedRef.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  function openAddSheet() {
    void setReasonParam('new');
  }

  function openEditSheet(reason: AppointmentCancelledReason) {
    void setReasonParam(String(reason.id));
  }

  function closeSheet() {
    void setReasonParam(null);
  }

  function handleReasonDeleted(reasonId: number) {
    if (editingReasonId === reasonId) {
      closeSheet();
    }
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
                placeholder="Search appointment cancelled reasons..."
                aria-label="Search appointment cancelled reasons"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" size="lg" onClick={openAddSheet}>
                  <PiPlusLight className="size-4" />
                  Add Appointment Cancelled Reason
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {reasonsQuery.isError ? (
          <Alert variant="destructive">
            <CiCircleAlert className="size-4" />
            <AlertTitle>Could not load Appointment Cancelled Reasons</AlertTitle>
            <AlertDescription>{getApiErrorMessage(reasonsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        <SkeletonCrossfade
          isLoading={reasonsQuery.isLoading}
          skeleton={
            <ViewSkeleton
              layout={viewLayout}
              canEdit={Boolean(canUpdate)}
              canDelete={Boolean(canDelete)}
            />
          }
        >
          {reasons.length === 0 && !debouncedSearch ? (
            <Empty className="bg-card min-h-80 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CiCircleRemove />
                </EmptyMedia>
                <EmptyTitle>No Appointment Cancelled Reasons yet</EmptyTitle>
                <EmptyDescription>
                  Create Appointment Cancelled Reasons to define why Appointments are cancelled in
                  this Tenant.
                </EmptyDescription>
              </EmptyHeader>
              {canCreate ? (
                <EmptyContent>
                  <Button type="button" onClick={openAddSheet}>
                    <PiPlusLight className="size-4" />
                    Add Appointment Cancelled Reason
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : reasons.length === 0 && debouncedSearch ? (
            <Empty className="bg-card min-h-72 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CiSearch />
                </EmptyMedia>
                <EmptyTitle>No results found</EmptyTitle>
                <EmptyDescription>
                  No Appointment Cancelled Reasons match &ldquo;{debouncedSearch}&rdquo;. Try a
                  different search term.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-4">
              {viewLayout === 'table' ? (
                <CancelledReasonTableView
                  reasons={reasons}
                  canEdit={canUpdate}
                  canDelete={canDelete}
                  onEdit={openEditSheet}
                  onDelete={setReasonPendingDelete}
                />
              ) : viewLayout === 'card' ? (
                <CancelledReasonCardView
                  reasons={reasons}
                  canEdit={canUpdate}
                  canDelete={canDelete}
                  onEdit={openEditSheet}
                  onDelete={setReasonPendingDelete}
                />
              ) : (
                <CancelledReasonListView
                  reasons={reasons}
                  canEdit={canUpdate}
                  canDelete={canDelete}
                  onEdit={openEditSheet}
                  onDelete={setReasonPendingDelete}
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
      </div>

      <CancelledReasonFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        mode={isCreating ? 'new' : 'edit'}
        reason={editingReason}
        loadError={editingReasonLoadFailed}
        onRetryLoad={() => void editingReasonQuery.refetch()}
      />

      <DeleteCancelledReasonDialog
        reason={reasonPendingDelete}
        onClose={() => setReasonPendingDelete(null)}
        onDeleted={handleReasonDeleted}
      />
    </>
  );
}
