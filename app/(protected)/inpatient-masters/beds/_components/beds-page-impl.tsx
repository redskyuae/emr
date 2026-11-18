'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, BedDouble, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';

import type { Bed } from '@/app/api/lib/modules/bed/schemas/bed-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useBedsQuery } from '@/app/queries/inpatient-masters/beds/useBeds';
import { useWardsQuery } from '@/app/queries/inpatient-masters/wards/useWards';
import { useHasPermission } from '@/app/queries/identity-access/useCurrentUser';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteBedDialog } from './_modals/delete-bed-dialog';
import { BedFormSheet } from './_sheets/bed-form-sheet';
import { BedTable, BedTableSkeleton } from './bed-table';

const PAGE_SIZE = 10;
const ALL_WARDS = 'all';

export function BedsPageImpl() {
  const [bedParam, setBedParam] = useQueryState('bed');
  const [wardFilter, setWardFilter] = useState(ALL_WARDS);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [bedPendingDelete, setBedPendingDelete] = useState<Bed | null>(null);

  const wardsQuery = useWardsQuery({ page: 1, limit: 999 });
  const bedsQuery = useBedsQuery({
    query: debouncedSearch || undefined,
    wardId: wardFilter !== ALL_WARDS ? Number(wardFilter) : undefined,
    page,
    limit: PAGE_SIZE,
  });

  const wardOptions = wardsQuery.data?.data ?? [];
  const beds = bedsQuery.data?.data ?? [];
  const meta = bedsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const isFiltered = Boolean(debouncedSearch) || wardFilter !== ALL_WARDS;

  const { data: canCreate } = useHasPermission('bed:create');
  const { data: canUpdate } = useHasPermission('bed:update');
  const { data: canDelete } = useHasPermission('bed:delete');

  // The sheet opens straight from the URL: ?bed=new creates, ?bed=<id> edits
  // once the row resolves from already-loaded query data.
  const isCreating = bedParam === 'new' && canCreate;
  const editingId =
    bedParam !== null && bedParam !== 'new' && /^\d+$/.test(bedParam) ? Number(bedParam) : null;
  const editingBed = editingId !== null ? (beds.find((row) => row.id === editingId) ?? null) : null;
  const sheetOpen = isCreating || (editingId !== null && canUpdate && editingBed !== null);

  function closeSheet() {
    void setBedParam(null);
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
                placeholder="Search beds..."
                aria-label="Search beds"
              />
            </InputGroup>

            <Select
              value={wardFilter}
              onValueChange={(value) => {
                setWardFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full lg:w-48" aria-label="Filter by ward">
                <SelectValue placeholder="All Wards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_WARDS}>All Wards</SelectItem>
                {wardOptions.map((ward) => (
                  <SelectItem key={ward.id} value={String(ward.id)}>
                    {ward.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" onClick={() => void setBedParam('new')}>
                  <Plus className="size-4" />
                  Add Bed
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {bedsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Beds</AlertTitle>
            <AlertDescription>{getApiErrorMessage(bedsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {bedsQuery.isLoading ? (
          <BedTableSkeleton />
        ) : beds.length === 0 && !isFiltered ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BedDouble />
              </EmptyMedia>
              <EmptyTitle>No Beds yet</EmptyTitle>
              <EmptyDescription>
                Create Beds inside Wards so Patients can be admitted. Create a Ward first if none
                exist.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate ? (
              <EmptyContent>
                <Button type="button" onClick={() => void setBedParam('new')}>
                  <Plus className="size-4" />
                  Add Bed
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : beds.length === 0 ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Beds match the current filters. Try a different search term or Ward.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <BedTable
              beds={beds}
              canEdit={canUpdate}
              canDelete={canDelete}
              onEdit={(bed) => void setBedParam(String(bed.id))}
              onDelete={setBedPendingDelete}
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

      <BedFormSheet
        open={sheetOpen}
        bed={editingBed}
        isCreating={isCreating}
        onClose={closeSheet}
      />

      <DeleteBedDialog
        bed={canDelete ? bedPendingDelete : null}
        onClose={() => setBedPendingDelete(null)}
      />
    </>
  );
}
