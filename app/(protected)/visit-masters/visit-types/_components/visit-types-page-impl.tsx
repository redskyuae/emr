'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { CiCircleAlert, CiSearch } from 'react-icons/ci';
import {
  PiCaretLeftLight,
  PiCaretRightLight,
  PiClipboardTextLight,
  PiPlusLight,
} from 'react-icons/pi';

import type { VisitType } from '@/app/api/lib/modules/visit-type/schemas/visit-type-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useVisitTypesQuery } from '@/app/queries/visit-masters/visit-types/useVisitTypes';
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
import { DeleteVisitTypeDialog } from './_modals/delete-visit-type-dialog';
import { VisitTypeFormSheet } from './_sheets/visit-type-form-sheet';
import { VisitTypeTable, VisitTypeTableSkeleton } from './visit-type-table';

const PAGE_SIZE = 10;

export function VisitTypesPageImpl() {
  const [visitTypeParam, setVisitTypeParam] = useQueryState('visitType');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [visitTypePendingDelete, setVisitTypePendingDelete] = useState<VisitType | null>(null);

  const visitTypesQuery = useVisitTypesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const visitTypes = visitTypesQuery.data?.data ?? [];
  const meta = visitTypesQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const { data: canCreate } = useHasPermission('visit-type:create');
  const { data: canUpdate } = useHasPermission('visit-type:update');
  const { data: canDelete } = useHasPermission('visit-type:delete');

  const isCreating = visitTypeParam === 'new' && canCreate;
  const editingId =
    visitTypeParam !== null && visitTypeParam !== 'new' && /^\d+$/.test(visitTypeParam)
      ? Number(visitTypeParam)
      : null;
  const editingVisitType =
    editingId !== null ? (visitTypes.find((row) => row.id === editingId) ?? null) : null;
  const sheetOpen = isCreating || (editingId !== null && canUpdate && editingVisitType !== null);

  function closeSheet() {
    void setVisitTypeParam(null);
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <InputGroup className="lg:max-w-sm">
              <InputGroupAddon>
                <CiSearch className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Search visit types..."
                aria-label="Search visit types"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" onClick={() => void setVisitTypeParam('new')}>
                  <PiPlusLight className="size-4" />
                  Add Visit Type
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {visitTypesQuery.isError ? (
          <Alert variant="destructive">
            <CiCircleAlert className="size-4" />
            <AlertTitle>Could not load Visit Types</AlertTitle>
            <AlertDescription>{getApiErrorMessage(visitTypesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        <SkeletonCrossfade
          isLoading={visitTypesQuery.isLoading}
          skeleton={<VisitTypeTableSkeleton canEdit={canUpdate} canDelete={canDelete} />}
        >
          {visitTypes.length === 0 && !debouncedSearch ? (
            <Empty className="bg-card min-h-80 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PiClipboardTextLight />
                </EmptyMedia>
                <EmptyTitle>No Visit Types yet</EmptyTitle>
                <EmptyDescription>
                  Create Visit Types to classify the clinical nature of a Visit, such as OPD
                  Consultation or Follow-up.
                </EmptyDescription>
              </EmptyHeader>
              {canCreate ? (
                <EmptyContent>
                  <Button type="button" onClick={() => void setVisitTypeParam('new')}>
                    <PiPlusLight className="size-4" />
                    Add Visit Type
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : visitTypes.length === 0 ? (
            <Empty className="bg-card min-h-72 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CiSearch />
                </EmptyMedia>
                <EmptyTitle>No results found</EmptyTitle>
                <EmptyDescription>
                  No Visit Types match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-4">
              <VisitTypeTable
                visitTypes={visitTypes}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={(visitType) => void setVisitTypeParam(String(visitType.id))}
                onDelete={setVisitTypePendingDelete}
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
                      <PiCaretLeftLight className="size-4" />
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
                      <PiCaretRightLight className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </SkeletonCrossfade>
      </div>

      <VisitTypeFormSheet
        open={sheetOpen}
        visitType={editingVisitType}
        isCreating={isCreating}
        onClose={closeSheet}
      />

      <DeleteVisitTypeDialog
        visitType={canDelete ? visitTypePendingDelete : null}
        onClose={() => setVisitTypePendingDelete(null)}
      />
    </>
  );
}
