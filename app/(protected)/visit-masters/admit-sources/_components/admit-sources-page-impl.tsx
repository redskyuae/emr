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

import type { AdmitSource } from '@/app/api/lib/modules/admit-source/schemas/admit-source-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAdmitSourcesQuery } from '@/app/queries/visit-masters/admit-sources/useAdmitSources';
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
import { DeleteAdmitSourceDialog } from './_modals/delete-admit-source-dialog';
import { AdmitSourceFormSheet } from './_sheets/admit-source-form-sheet';
import { AdmitSourceTable, AdmitSourceTableSkeleton } from './admit-source-table';

const PAGE_SIZE = 10;

export function AdmitSourcesPageImpl() {
  const [admitSourceParam, setAdmitSourceParam] = useQueryState('admitSource');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [admitSourcePendingDelete, setAdmitSourcePendingDelete] = useState<AdmitSource | null>(
    null
  );

  const admitSourcesQuery = useAdmitSourcesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const admitSources = admitSourcesQuery.data?.data ?? [];
  const meta = admitSourcesQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const { data: canCreate } = useHasPermission('admit-source:create');
  const { data: canUpdate } = useHasPermission('admit-source:update');
  const { data: canDelete } = useHasPermission('admit-source:delete');

  const isCreating = admitSourceParam === 'new' && canCreate;
  const editingId =
    admitSourceParam !== null && admitSourceParam !== 'new' && /^\d+$/.test(admitSourceParam)
      ? Number(admitSourceParam)
      : null;
  const editingAdmitSource =
    editingId !== null ? (admitSources.find((row) => row.id === editingId) ?? null) : null;
  const sheetOpen = isCreating || (editingId !== null && canUpdate && editingAdmitSource !== null);

  function closeSheet() {
    void setAdmitSourceParam(null);
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
                placeholder="Search Admit Sources..."
                aria-label="Search Admit Sources"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" onClick={() => void setAdmitSourceParam('new')}>
                  <PiPlusLight className="size-4" />
                  Add Admit Source
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {admitSourcesQuery.isError ? (
          <Alert variant="destructive">
            <CiCircleAlert className="size-4" />
            <AlertTitle>Could not load Admit Sources</AlertTitle>
            <AlertDescription>{getApiErrorMessage(admitSourcesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        <SkeletonCrossfade
          isLoading={admitSourcesQuery.isLoading}
          skeleton={<AdmitSourceTableSkeleton canEdit={canUpdate} canDelete={canDelete} />}
        >
          {admitSources.length === 0 && !debouncedSearch ? (
            <Empty className="bg-card min-h-80 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PiClipboardTextLight />
                </EmptyMedia>
                <EmptyTitle>No Admit Sources yet</EmptyTitle>
                <EmptyDescription>
                  Create Admit Sources to record how a Patient came to a Visit, such as Doctor
                  Referral or Hospital Transfer.
                </EmptyDescription>
              </EmptyHeader>
              {canCreate ? (
                <EmptyContent>
                  <Button type="button" onClick={() => void setAdmitSourceParam('new')}>
                    <PiPlusLight className="size-4" />
                    Add Admit Source
                  </Button>
                </EmptyContent>
              ) : null}
            </Empty>
          ) : admitSources.length === 0 ? (
            <Empty className="bg-card min-h-72 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CiSearch />
                </EmptyMedia>
                <EmptyTitle>No results found</EmptyTitle>
                <EmptyDescription>
                  No Admit Sources match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                  term.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-4">
              <AdmitSourceTable
                admitSources={admitSources}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={(admitSource) => void setAdmitSourceParam(String(admitSource.id))}
                onDelete={setAdmitSourcePendingDelete}
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

      <AdmitSourceFormSheet
        open={sheetOpen}
        admitSource={editingAdmitSource}
        isCreating={isCreating}
        onClose={closeSheet}
      />

      <DeleteAdmitSourceDialog
        admitSource={canDelete ? admitSourcePendingDelete : null}
        onClose={() => setAdmitSourcePendingDelete(null)}
      />
    </>
  );
}
