'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, ChevronLeft, ChevronRight, ClipboardList, Plus, Search } from 'lucide-react';

import type { Ward } from '@/app/api/lib/modules/ward/schemas/ward-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useWardsQuery } from '@/app/queries/inpatient-masters/wards/useWards';
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
import { DeleteWardDialog } from './_modals/delete-ward-dialog';
import { WardFormSheet } from './_sheets/ward-form-sheet';
import { WardTable, WardTableSkeleton } from './ward-table';

const PAGE_SIZE = 10;

export function WardsPageImpl() {
  const [wardParam, setWardParam] = useQueryState('ward');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [wardPendingDelete, setWardPendingDelete] = useState<Ward | null>(null);

  const wardsQuery = useWardsQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const wards = wardsQuery.data?.data ?? [];
  const meta = wardsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  // The sheet opens straight from the URL: ?ward=new creates, ?ward=<id>
  // edits once the row resolves from already-loaded query data.
  const isCreating = wardParam === 'new';
  const editingId =
    wardParam !== null && wardParam !== 'new' && /^\d+$/.test(wardParam) ? Number(wardParam) : null;
  const editingWard =
    editingId !== null ? (wards.find((row) => row.id === editingId) ?? null) : null;
  const sheetOpen = isCreating || (editingId !== null && editingWard !== null);

  function closeSheet() {
    void setWardParam(null);
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
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Search wards..."
                aria-label="Search wards"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" onClick={() => void setWardParam('new')}>
                <Plus className="size-4" />
                Add Ward
              </Button>
            </div>
          </CardContent>
        </Card>

        {wardsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Wards</AlertTitle>
            <AlertDescription>{getApiErrorMessage(wardsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {wardsQuery.isLoading ? (
          <WardTableSkeleton />
        ) : wards.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>No Wards yet</EmptyTitle>
              <EmptyDescription>
                Create Wards to organise inpatient Beds into named sections of the Facility, such as
                ICU, General Ward, or Maternity.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setWardParam('new')}>
                <Plus className="size-4" />
                Add Ward
              </Button>
            </EmptyContent>
          </Empty>
        ) : wards.length === 0 ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Wards match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <WardTable
              wards={wards}
              onEdit={(ward) => void setWardParam(String(ward.id))}
              onDelete={setWardPendingDelete}
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
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
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

      <WardFormSheet
        open={sheetOpen}
        ward={editingWard}
        isCreating={isCreating}
        onClose={closeSheet}
      />

      <DeleteWardDialog ward={wardPendingDelete} onClose={() => setWardPendingDelete(null)} />
    </>
  );
}
