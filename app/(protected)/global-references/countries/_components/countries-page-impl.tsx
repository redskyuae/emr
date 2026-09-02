'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Globe2,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/app/queries/api-error';
import {
  type Country,
  useCountriesQuery,
} from '@/app/queries/global-references/countries/useCountries';
import { useCountryQuery } from '@/app/queries/global-references/countries/useCountry';
import { useDeleteCountry } from '@/app/queries/global-references/countries/useDeleteCountry';
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
import { CountryDeleteDialog } from './_modals/delete-country-dialog';
import { CountryFormSheet } from './_sheets/country-form-sheet';
import { ViewSkeleton } from './country-skeletons';
import { CountryCardView, CountryListView, CountryTableView } from './country-views';

type ViewLayout = 'table' | 'card' | 'list';
type GlobalReferenceEntity = Country;

const PAGE_SIZE = 10;

function getNumericParam(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

export function CountriesPageImpl() {
  const [recordParam, setRecordParam] = useQueryState('country');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [deleteRecord, setDeleteRecord] = useState<GlobalReferenceEntity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const deleteMutation = useDeleteCountry();

  const { data: canCreate } = useHasPermission('country:create');
  const { data: canUpdate } = useHasPermission('country:update');
  const { data: canDelete } = useHasPermission('country:delete');

  const isCreating = recordParam === 'new' && canCreate;
  const editingRecordId = recordParam !== 'new' ? getNumericParam(recordParam) : null;

  const countriesQuery = useCountriesQuery({
    page,
    limit: PAGE_SIZE,
    query: debouncedSearch || undefined,
  });

  const countries = countriesQuery.data?.data ?? [];
  const meta = countriesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingCountryFromList =
    editingRecordId !== null
      ? (countries.find((country) => country.id === editingRecordId) ?? null)
      : null;

  const shouldFetchEditingCountry =
    editingRecordId !== null && !countriesQuery.isLoading && editingCountryFromList === null;
  const editingCountryQuery = useCountryQuery(shouldFetchEditingCountry ? editingRecordId : null);
  const editingCountry = editingCountryFromList ?? editingCountryQuery.data ?? null;

  const recordResolving =
    editingRecordId !== null &&
    editingCountry === null &&
    (countriesQuery.isLoading || editingCountryQuery.isFetching);
  const sheetOpen =
    isCreating || (editingRecordId !== null && (recordResolving || editingCountry !== null));

  function openEdit(country: Country) {
    void setRecordParam(String(country.id));
  }

  function openDelete(country: Country) {
    setDeleteRecord(country);
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
      toast.success('Country deleted.');
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
                placeholder="Search countries..."
                aria-label="Search countries"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" size="lg" onClick={() => void setRecordParam('new')}>
                  <Plus className="size-4" />
                  Add Country
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {countriesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Countries</AlertTitle>
            <AlertDescription>{getApiErrorMessage(countriesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {countriesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : countries.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Globe2 />
              </EmptyMedia>
              <EmptyTitle>No Countries yet</EmptyTitle>
              <EmptyDescription>
                Create Countries used in address and identity-document context.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate ? (
              <EmptyContent>
                <Button type="button" onClick={() => void setRecordParam('new')}>
                  <Plus className="size-4" />
                  Add Country
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : countries.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Countries match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <CountryTableView
                countries={countries}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ) : viewLayout === 'card' ? (
              <CountryCardView
                countries={countries}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ) : (
              <CountryListView
                countries={countries}
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

      <CountryFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        recordId={editingRecordId}
        record={editingCountry}
        isResolving={recordResolving}
        onClose={() => void setRecordParam(null)}
      />

      <CountryDeleteDialog
        country={deleteRecord}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteRecord(null)}
      />
    </>
  );
}
