'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { AlertCircle, ChevronLeft, ChevronRight, ClipboardList, Plus, Search } from 'lucide-react';

import type { AdmissionType } from '@/app/api/lib/modules/admission-type/schemas/admission-type-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAdmissionTypesQuery } from '@/app/queries/inpatient-masters/admission-types/useAdmissionTypes';
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
import { DeleteAdmissionTypeDialog } from './_modals/delete-admission-type-dialog';
import { AdmissionTypeFormSheet } from './_sheets/admission-type-form-sheet';
import { AdmissionTypeTable, AdmissionTypeTableSkeleton } from './admission-type-table';

const PAGE_SIZE = 10;

export function AdmissionTypesPageImpl() {
  const [admissionTypeParam, setAdmissionTypeParam] = useQueryState('admissionType');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [admissionTypePendingDelete, setAdmissionTypePendingDelete] =
    useState<AdmissionType | null>(null);

  const admissionTypesQuery = useAdmissionTypesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const admissionTypes = admissionTypesQuery.data?.data ?? [];
  const meta = admissionTypesQuery.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const { data: canCreate } = useHasPermission('admission-type:create');
  const { data: canUpdate } = useHasPermission('admission-type:update');
  const { data: canDelete } = useHasPermission('admission-type:delete');

  // The sheet opens straight from the URL: ?admissionType=new creates, ?admissionType=<id>
  // edits once the row resolves from already-loaded query data.
  const isCreating = admissionTypeParam === 'new' && canCreate;
  const editingId =
    admissionTypeParam !== null && admissionTypeParam !== 'new' && /^\d+$/.test(admissionTypeParam)
      ? Number(admissionTypeParam)
      : null;
  const editingAdmissionType =
    editingId !== null ? (admissionTypes.find((row) => row.id === editingId) ?? null) : null;
  const sheetOpen =
    isCreating || (editingId !== null && canUpdate && editingAdmissionType !== null);

  function closeSheet() {
    void setAdmissionTypeParam(null);
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
                placeholder="Search admission types..."
                aria-label="Search admission types"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" onClick={() => void setAdmissionTypeParam('new')}>
                  <Plus className="size-4" />
                  Add Admission Type
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {admissionTypesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Admission Types</AlertTitle>
            <AlertDescription>{getApiErrorMessage(admissionTypesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {admissionTypesQuery.isLoading ? (
          <AdmissionTypeTableSkeleton />
        ) : admissionTypes.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>No Admission Types yet</EmptyTitle>
              <EmptyDescription>
                Create Admission Types to classify how a Patient came to be admitted, such as
                Emergency, Elective, or Transfer.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate ? (
              <EmptyContent>
                <Button type="button" onClick={() => void setAdmissionTypeParam('new')}>
                  <Plus className="size-4" />
                  Add Admission Type
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : admissionTypes.length === 0 ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Admission Types match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <AdmissionTypeTable
              admissionTypes={admissionTypes}
              canEdit={canUpdate}
              canDelete={canDelete}
              onEdit={(admissionType) => void setAdmissionTypeParam(String(admissionType.id))}
              onDelete={setAdmissionTypePendingDelete}
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

      <AdmissionTypeFormSheet
        open={sheetOpen}
        admissionType={editingAdmissionType}
        isCreating={isCreating}
        onClose={closeSheet}
      />

      <DeleteAdmissionTypeDialog
        admissionType={canDelete ? admissionTypePendingDelete : null}
        onClose={() => setAdmissionTypePendingDelete(null)}
      />
    </>
  );
}
