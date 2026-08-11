'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Languages,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/app/queries/api-error';
import {
  type Language,
  useLanguagesQuery,
} from '@/app/queries/global-references/languages/useLanguages';
import { useLanguageQuery } from '@/app/queries/global-references/languages/useLanguage';
import { useDeleteLanguage } from '@/app/queries/global-references/languages/useDeleteLanguage';
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
import { LanguageDeleteDialog } from './_modals/delete-language-dialog';
import { LanguageFormSheet } from './_sheets/language-form-sheet';
import { ViewSkeleton } from './language-skeletons';
import { LanguageCardView, LanguageListView, LanguageTableView } from './language-views';

type ViewLayout = 'table' | 'card' | 'list';
type GlobalReferenceEntity = Language;

const PAGE_SIZE = 10;

function getNumericParam(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

export function LanguagesPageImpl() {
  const [recordParam, setRecordParam] = useQueryState('language');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [deleteRecord, setDeleteRecord] = useState<GlobalReferenceEntity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const deleteMutation = useDeleteLanguage();

  const isCreating = recordParam === 'new';
  const editingRecordId = recordParam !== 'new' ? getNumericParam(recordParam) : null;

  const languagesQuery = useLanguagesQuery({
    page,
    limit: PAGE_SIZE,
    query: debouncedSearch || undefined,
  });

  const languages = languagesQuery.data?.data ?? [];
  const meta = languagesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingLanguageFromList =
    editingRecordId !== null
      ? (languages.find((language) => language.id === editingRecordId) ?? null)
      : null;

  const shouldFetchEditingLanguage =
    editingRecordId !== null && !languagesQuery.isLoading && editingLanguageFromList === null;
  const editingLanguageQuery = useLanguageQuery(
    shouldFetchEditingLanguage ? editingRecordId : null
  );
  const editingLanguage = editingLanguageFromList ?? editingLanguageQuery.data ?? null;

  const recordResolving =
    editingRecordId !== null &&
    editingLanguage === null &&
    (languagesQuery.isLoading || editingLanguageQuery.isFetching);
  const sheetOpen =
    isCreating || (editingRecordId !== null && (recordResolving || editingLanguage !== null));

  function openEdit(language: Language) {
    void setRecordParam(String(language.id));
  }

  function openDelete(language: Language) {
    setDeleteRecord(language);
  }

  function updateSearchTerm(value: string) {
    setSearchTerm(value);
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleteRecord) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleteRecord.id);
      toast.success('Language deleted.');
      setDeleteRecord(null);
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
                placeholder="Search languages..."
                aria-label="Search languages"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={() => void setRecordParam('new')}>
                <Plus className="size-4" />
                Add Language
              </Button>
            </div>
          </CardContent>
        </Card>

        {languagesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Languages</AlertTitle>
            <AlertDescription>{getApiErrorMessage(languagesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {languagesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : languages.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Languages />
              </EmptyMedia>
              <EmptyTitle>No Languages yet</EmptyTitle>
              <EmptyDescription>
                Create Languages used when recording Patient demographics.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setRecordParam('new')}>
                <Plus className="size-4" />
                Add Language
              </Button>
            </EmptyContent>
          </Empty>
        ) : languages.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Languages match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <LanguageTableView languages={languages} onEdit={openEdit} onDelete={openDelete} />
            ) : viewLayout === 'card' ? (
              <LanguageCardView languages={languages} onEdit={openEdit} onDelete={openDelete} />
            ) : (
              <LanguageListView languages={languages} onEdit={openEdit} onDelete={openDelete} />
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

      <LanguageFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        recordId={editingRecordId}
        record={editingLanguage}
        isResolving={recordResolving}
        onClose={() => void setRecordParam(null)}
      />

      <LanguageDeleteDialog
        language={deleteRecord}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteRecord(null)}
      />
    </>
  );
}
