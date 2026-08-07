'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Landmark,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/app/queries/api-error';
import {
  type GlobalReferenceEntity,
  useDeleteGlobalReference,
  useGlobalReferenceItemQuery,
  useGlobalReferenceListQuery,
} from '@/app/queries/global-references/useGlobalReferencesManagement';
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
import { ReligionDeleteDialog } from './_modals/delete-religion-dialog';
import { ReligionFormSheet } from './_sheets/religion-form-sheet';
import { ViewSkeleton } from './religion-skeletons';
import { ReligionCardView, ReligionListView, ReligionTableView } from './religion-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

function getNumericParam(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

export function ReligionsPageImpl() {
  const [recordParam, setRecordParam] = useQueryState('religion');
  const [deleteRecordParam, setDeleteRecordParam] = useQueryState('religionDelete');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const deleteMutation = useDeleteGlobalReference();

  const isCreating = recordParam === 'new';
  const editingRecordId = recordParam !== 'new' ? getNumericParam(recordParam) : null;
  const deleteRecordId = getNumericParam(deleteRecordParam);

  const religionsQuery = useGlobalReferenceListQuery('religions', {
    page,
    limit: PAGE_SIZE,
    query: debouncedSearch || undefined,
  });

  const religions = religionsQuery.data?.data ?? [];
  const meta = religionsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingReligionFromList =
    editingRecordId !== null
      ? (religions.find((religion) => religion.id === editingRecordId) ?? null)
      : null;
  const deleteReligionFromList =
    deleteRecordId !== null
      ? (religions.find((religion) => religion.id === deleteRecordId) ?? null)
      : null;

  const shouldFetchEditingReligion =
    editingRecordId !== null && !religionsQuery.isLoading && editingReligionFromList === null;
  const editingReligionQuery = useGlobalReferenceItemQuery(
    'religions',
    shouldFetchEditingReligion ? editingRecordId : null
  );
  const editingReligion = editingReligionFromList ?? editingReligionQuery.data ?? null;

  const shouldFetchDeleteReligion =
    deleteRecordId !== null && !religionsQuery.isLoading && deleteReligionFromList === null;
  const deleteReligionQuery = useGlobalReferenceItemQuery(
    'religions',
    shouldFetchDeleteReligion ? deleteRecordId : null
  );
  const deleteReligion = deleteReligionFromList ?? deleteReligionQuery.data ?? null;

  const recordResolving =
    editingRecordId !== null &&
    editingReligion === null &&
    (religionsQuery.isLoading || editingReligionQuery.isFetching);
  const sheetOpen =
    isCreating || (editingRecordId !== null && (recordResolving || editingReligion !== null));

  const deleteRecordResolving =
    deleteRecordId !== null &&
    deleteReligion === null &&
    (religionsQuery.isLoading || deleteReligionQuery.isFetching);
  const deleteDialogOpen =
    deleteRecordId !== null && (deleteRecordResolving || deleteReligion !== null);

  function openEdit(religion: GlobalReferenceEntity) {
    void setRecordParam(String(religion.id));
  }

  function openDelete(religion: GlobalReferenceEntity) {
    void setDeleteRecordParam(String(religion.id));
  }

  function updateSearchTerm(value: string) {
    setSearchTerm(value);
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleteReligion) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ resource: 'religions', id: deleteReligion.id });
      toast.success('Religion deleted.');
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
                placeholder="Search religions..."
                aria-label="Search religions"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={() => void setRecordParam('new')}>
                <Plus className="size-4" />
                Add Religion
              </Button>
            </div>
          </CardContent>
        </Card>

        {religionsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Religions</AlertTitle>
            <AlertDescription>{getApiErrorMessage(religionsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {religionsQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : religions.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Landmark />
              </EmptyMedia>
              <EmptyTitle>No Religions yet</EmptyTitle>
              <EmptyDescription>
                Create Religions used when recording Patient demographics.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setRecordParam('new')}>
                <Plus className="size-4" />
                Add Religion
              </Button>
            </EmptyContent>
          </Empty>
        ) : religions.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Religions match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <ReligionTableView religions={religions} onEdit={openEdit} onDelete={openDelete} />
            ) : viewLayout === 'card' ? (
              <ReligionCardView religions={religions} onEdit={openEdit} onDelete={openDelete} />
            ) : (
              <ReligionListView religions={religions} onEdit={openEdit} onDelete={openDelete} />
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

      <ReligionFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        recordId={editingRecordId}
        record={editingReligion}
        isResolving={recordResolving}
        onClose={() => void setRecordParam(null)}
      />

      <ReligionDeleteDialog
        religion={deleteDialogOpen ? deleteReligion : null}
        isDeleting={deleteMutation.isPending || deleteRecordResolving}
        onConfirm={() => void confirmDelete()}
        onCancel={() => void setDeleteRecordParam(null)}
      />
    </>
  );
}
