'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, ChevronLeft, ChevronRight, ClipboardList, Plus, Search } from 'lucide-react';
import type { VisitStatus } from '@/app/api/lib/modules/visit-status/schemas/visit-status-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useVisitStatusQuery } from '@/app/queries/visit-masters/useVisitStatus';
import { useVisitStatusesQuery } from '@/app/queries/visit-masters/useVisitStatuses';
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
import { VisitStatusDeleteDialog } from './_modals/visit-status-delete-dialog';
import { VisitStatusFormSheet } from './_sheets/visit-status-form-sheet';
import { VisitStatusTable, VisitStatusTableSkeleton } from './visit-status-table';

const PAGE_SIZE = 10;

export function VisitStatusesPageImpl() {
  const [statusParam, setStatusParam] = useQueryState('status');
  const [statusPendingDelete, setStatusPendingDelete] = useState<VisitStatus | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const isCreating = statusParam === 'new';
  const editingStatusId =
    statusParam !== null && statusParam !== 'new' && /^\d+$/.test(statusParam)
      ? Number(statusParam)
      : null;

  const statusesQuery = useVisitStatusesQuery({
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
  const editingStatusQuery = useVisitStatusQuery(shouldFetchEditingStatus ? editingStatusId : null);
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
            <InputGroup className="bg-background shadow-fluent-2 h-9 lg:max-w-sm">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search visit statuses..."
                aria-label="Search visit statuses"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={() => void setStatusParam('new')}>
                <Plus className="size-4" />
                Add Visit Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {statusesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Visit Statuses</AlertTitle>
            <AlertDescription>{getApiErrorMessage(statusesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {statusesQuery.isLoading ? (
          <VisitStatusTableSkeleton />
        ) : statuses.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>No Visit Statuses yet</EmptyTitle>
              <EmptyDescription>
                Create Visit Statuses to define lifecycle states for Visits in this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setStatusParam('new')}>
                <Plus className="size-4" />
                Add Visit Status
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
                No Visit Statuses match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <VisitStatusTable
              statuses={statuses}
              onEdit={(status) => void setStatusParam(String(status.id))}
              onDelete={(status) => setStatusPendingDelete(status)}
            />

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

      <VisitStatusFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        statusId={editingStatusId}
        status={editingStatus}
        isResolving={statusResolving}
        onClose={() => void setStatusParam(null)}
      />

      <VisitStatusDeleteDialog
        status={statusPendingDelete}
        onClose={() => setStatusPendingDelete(null)}
        onDeleted={(deletedId) => {
          if (editingStatusId === deletedId) {
            void setStatusParam(null);
          }
        }}
      />
    </>
  );
}
