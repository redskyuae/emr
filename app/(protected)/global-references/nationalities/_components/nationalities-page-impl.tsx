'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/app/queries/api-error';
import {
  type Nationality,
  useNationalitiesQuery,
} from '@/app/queries/global-references/nationalities/useNationalities';
import { useNationalityQuery } from '@/app/queries/global-references/nationalities/useNationality';
import { useDeleteNationality } from '@/app/queries/global-references/nationalities/useDeleteNationality';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { NationalityDeleteDialog } from './_modals/delete-nationality-dialog';
import { NationalityFormSheet } from './_sheets/nationality-form-sheet';
import { ViewSkeleton } from './nationality-skeletons';
import {
  NationalityCardView,
  NationalityListView,
  NationalityTableView,
} from './nationality-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

function getNumericParam(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

export function NationalitiesPageImpl() {
  const [recordParam, setRecordParam] = useQueryState('nationality');
  const [deleteRecordParam, setDeleteRecordParam] = useQueryState('nationalityDelete');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const deleteMutation = useDeleteNationality();

  const { data: canCreate } = useHasPermission('nationality:create');
  const { data: canUpdate } = useHasPermission('nationality:update');
  const { data: canDelete } = useHasPermission('nationality:delete');

  const isCreating = recordParam === 'new' && canCreate;
  const editingRecordId = recordParam !== 'new' ? getNumericParam(recordParam) : null;
  const deleteRecordId = getNumericParam(deleteRecordParam);

  const nationalitiesQuery = useNationalitiesQuery({
    page,
    limit: PAGE_SIZE,
    query: debouncedSearch || undefined,
  });

  const nationalities = nationalitiesQuery.data?.data ?? [];
  const meta = nationalitiesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingNationalityFromList =
    editingRecordId !== null
      ? (nationalities.find((nationality) => nationality.id === editingRecordId) ?? null)
      : null;
  const deleteNationality =
    deleteRecordId !== null
      ? (nationalities.find((nationality) => nationality.id === deleteRecordId) ?? null)
      : null;

  const shouldFetchEditingNationality =
    editingRecordId !== null &&
    !nationalitiesQuery.isLoading &&
    editingNationalityFromList === null;
  const editingNationalityQuery = useNationalityQuery(
    shouldFetchEditingNationality ? editingRecordId : null
  );
  const editingNationality = editingNationalityFromList ?? editingNationalityQuery.data ?? null;

  const recordResolving =
    editingRecordId !== null &&
    editingNationality === null &&
    (nationalitiesQuery.isLoading || editingNationalityQuery.isFetching);
  const sheetOpen =
    isCreating || (editingRecordId !== null && (recordResolving || editingNationality !== null));

  function openEdit(nationality: Nationality) {
    void setRecordParam(String(nationality.id));
  }

  function openDelete(nationality: Nationality) {
    void setDeleteRecordParam(String(nationality.id));
  }

  function updateSearchTerm(value: string) {
    setSearchTerm(value);
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleteNationality) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleteNationality.id);
      toast.success('Nationality deleted.');
      void setDeleteRecordParam(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
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
                onChange={(event) => updateSearchTerm(event.target.value)}
                placeholder="Search nationalities..."
                aria-label="Search nationalities"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" size="lg" onClick={() => void setRecordParam('new')}>
                  <Plus className="size-4" />
                  Add Nationality
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {nationalitiesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Nationalities</AlertTitle>
            <AlertDescription>{getApiErrorMessage(nationalitiesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {nationalitiesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : nationalities.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Flag />
              </EmptyMedia>
              <EmptyTitle>No Nationalities yet</EmptyTitle>
              <EmptyDescription>
                Create Nationalities used during Patient Registration.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate ? (
              <EmptyContent>
                <Button type="button" onClick={() => void setRecordParam('new')}>
                  <Plus className="size-4" />
                  Add Nationality
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : nationalities.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Nationalities match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <NationalityTableView
                nationalities={nationalities}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ) : viewLayout === 'card' ? (
              <NationalityCardView
                nationalities={nationalities}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ) : (
              <NationalityListView
                nationalities={nationalities}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEdit}
                onDelete={openDelete}
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

      <NationalityFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        recordId={editingRecordId}
        record={editingNationality}
        isResolving={recordResolving}
        onClose={() => void setRecordParam(null)}
      />

      <NationalityDeleteDialog
        nationality={deleteNationality}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => void setDeleteRecordParam(null)}
      />
    </>
  );
}
