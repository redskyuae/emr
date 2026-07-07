'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useQueryState } from 'nuqs';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
  XCircle,
} from 'lucide-react';
import type { AppointmentCancelledReason } from '@/app/api/lib/modules/appointment-cancelled-reason/schemas/appointment-cancelled-reason-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAppointmentCancelledReasonQuery } from '@/app/queries/appointment-masters/cancelled-reasons/useAppointmentCancelledReason';
import { useAppointmentCancelledReasonsQuery } from '@/app/queries/appointment-masters/cancelled-reasons/useAppointmentCancelledReasons';
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

  const reasons = reasonsQuery.data?.data ?? [];
  const meta = reasonsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  // The sheet opens straight from the URL, with no effect syncing state back to it.
  // - ?reason=new                 -> create
  // - ?reason=<id> still loading  -> open, resolving
  // - ?reason=<id> found          -> edit
  // - ?reason=<id> not found, or garbage -> stays closed (the stale param is
  //   harmless and gets overwritten by the next action)
  const isCreating = reasonParam === 'new';
  const editingReasonId =
    reasonParam !== null && reasonParam !== 'new' && /^\d+$/.test(reasonParam)
      ? Number(reasonParam)
      : null;
  const editingReasonFromList =
    editingReasonId !== null
      ? (reasons.find((reason) => reason.id === editingReasonId) ?? null)
      : null;

  // The current page's `reasons` may not include the target id (it lives on a
  // different page or is filtered out by the active search), so fall back to
  // fetching it directly by id once the list has loaded and it isn't there.
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
  const sheetOpen =
    isCreating || (editingReasonId !== null && (editingReasonResolving || editingReason !== null));

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
                placeholder="Search appointment cancelled reasons..."
                aria-label="Search appointment cancelled reasons"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Appointment Cancelled Reason
              </Button>
            </div>
          </CardContent>
        </Card>

        {reasonsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Appointment Cancelled Reasons</AlertTitle>
            <AlertDescription>{getApiErrorMessage(reasonsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {reasonsQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : reasons.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <XCircle />
              </EmptyMedia>
              <EmptyTitle>No Appointment Cancelled Reasons yet</EmptyTitle>
              <EmptyDescription>
                Create Appointment Cancelled Reasons to define why Appointments are cancelled in
                this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Appointment Cancelled Reason
              </Button>
            </EmptyContent>
          </Empty>
        ) : reasons.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Appointment Cancelled Reasons match &ldquo;{debouncedSearch}&rdquo;. Try a
                different search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <CancelledReasonTableView
                reasons={reasons}
                onEdit={openEditSheet}
                onDelete={setReasonPendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <CancelledReasonCardView
                reasons={reasons}
                onEdit={openEditSheet}
                onDelete={setReasonPendingDelete}
              />
            ) : (
              <CancelledReasonListView
                reasons={reasons}
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

      <CancelledReasonFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        mode={isCreating ? 'new' : 'edit'}
        reason={editingReason}
      />

      <DeleteCancelledReasonDialog
        reason={reasonPendingDelete}
        onClose={() => setReasonPendingDelete(null)}
        onDeleted={handleReasonDeleted}
      />
    </>
  );
}
