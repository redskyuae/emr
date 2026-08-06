'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Globe2,
  Landmark,
  Languages,
  LayoutGrid,
  LayoutList,
  MapPinned,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useCountriesQuery } from '@/app/queries/global-references/useCountries';
import {
  type GlobalReferenceEntity,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { GlobalReferenceDeleteDialog } from './_modals/global-reference-delete-dialog';
import { GlobalReferenceFormSheet } from './_sheets/global-reference-form-sheet';
import { type GlobalReferenceScreenKey, globalReferenceScreens } from './global-reference-config';
import { ViewSkeleton } from './global-reference-skeletons';
import {
  GlobalReferenceCardView,
  GlobalReferenceListView,
  GlobalReferenceTableView,
} from './global-reference-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

function getNumericParam(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

function StateCountryFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const countriesQuery = useCountriesQuery();
  const countries = countriesQuery.data ?? [];

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={countriesQuery.isLoading || countries.length === 0}
    >
      <SelectTrigger className="bg-background h-9 w-full lg:w-52" aria-label="Filter by Country">
        <SelectValue
          placeholder={countriesQuery.isLoading ? 'Loading Countries...' : 'All Countries'}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Countries</SelectItem>
        {countries.map((country) => (
          <SelectItem key={country.id} value={String(country.id)}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function GlobalReferencePageImpl({ screen }: { screen: GlobalReferenceScreenKey }) {
  const config = globalReferenceScreens[screen];
  const deleteParamName = `${config.queryParam}Delete`;
  const [recordParam, setRecordParam] = useQueryState(config.queryParam);
  const [deleteRecordParam, setDeleteRecordParam] = useQueryState(deleteParamName);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const isCreating = recordParam === 'new';
  const editingRecordId = recordParam !== 'new' ? getNumericParam(recordParam) : null;
  const deleteRecordId = getNumericParam(deleteRecordParam);
  const countryId =
    config.hasCountry && countryFilter !== 'all' ? Number(countryFilter) : undefined;

  const listQuery = useGlobalReferenceListQuery(config.resource, {
    page,
    countryId,
    limit: PAGE_SIZE,
    query: debouncedSearch || undefined,
  });

  const records = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingRecordFromList =
    editingRecordId !== null
      ? (records.find((record) => record.id === editingRecordId) ?? null)
      : null;
  const deleteRecordFromList =
    deleteRecordId !== null
      ? (records.find((record) => record.id === deleteRecordId) ?? null)
      : null;

  const shouldFetchEditingRecord =
    editingRecordId !== null && !listQuery.isLoading && editingRecordFromList === null;
  const editingRecordQuery = useGlobalReferenceItemQuery(
    config.resource,
    shouldFetchEditingRecord ? editingRecordId : null
  );
  const editingRecord = editingRecordFromList ?? editingRecordQuery.data ?? null;

  const shouldFetchDeleteRecord =
    deleteRecordId !== null && !listQuery.isLoading && deleteRecordFromList === null;
  const deleteRecordQuery = useGlobalReferenceItemQuery(
    config.resource,
    shouldFetchDeleteRecord ? deleteRecordId : null
  );
  const deleteRecord = deleteRecordFromList ?? deleteRecordQuery.data ?? null;

  const recordResolving =
    editingRecordId !== null &&
    editingRecord === null &&
    (listQuery.isLoading || editingRecordQuery.isFetching);
  const sheetOpen =
    isCreating || (editingRecordId !== null && (recordResolving || editingRecord !== null));

  const deleteRecordResolving =
    deleteRecordId !== null &&
    deleteRecord === null &&
    (listQuery.isLoading || deleteRecordQuery.isFetching);
  const deleteDialogOpen =
    deleteRecordId !== null && (deleteRecordResolving || deleteRecord !== null);

  function openEdit(record: GlobalReferenceEntity) {
    void setRecordParam(String(record.id));
  }

  function openDelete(record: GlobalReferenceEntity) {
    void setDeleteRecordParam(String(record.id));
  }

  function updateSearchTerm(value: string) {
    setSearchTerm(value);
    setPage(1);
  }

  function updateCountryFilter(value: string) {
    setCountryFilter(value);
    setPage(1);
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
                placeholder={config.searchPlaceholder}
                aria-label={`Search ${config.lowerPlural}`}
              />
            </InputGroup>

            {config.hasCountry ? (
              <StateCountryFilter value={countryFilter} onChange={updateCountryFilter} />
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={() => void setRecordParam('new')}>
                <Plus className="size-4" />
                {config.addButtonLabel}
              </Button>
            </div>
          </CardContent>
        </Card>

        {listQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load {config.pluralTitle}</AlertTitle>
            <AlertDescription>{getApiErrorMessage(listQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {listQuery.isLoading ? (
          <ViewSkeleton
            layout={viewLayout}
            hasCode={config.hasCode}
            hasCountry={config.hasCountry}
          />
        ) : records.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {config.resource === 'languages' ? <Languages /> : null}
                {config.resource === 'nationalities' ? <Flag /> : null}
                {config.resource === 'religions' ? <Landmark /> : null}
                {config.resource === 'countries' ? <Globe2 /> : null}
                {config.resource === 'states' ? <MapPinned /> : null}
              </EmptyMedia>
              <EmptyTitle>{config.emptyTitle}</EmptyTitle>
              <EmptyDescription>{config.emptyDescription}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setRecordParam('new')}>
                <Plus className="size-4" />
                {config.addButtonLabel}
              </Button>
            </EmptyContent>
          </Empty>
        ) : records.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No {config.pluralTitle} match &ldquo;{debouncedSearch}&rdquo;. Try a different
                search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <GlobalReferenceTableView
                records={records}
                config={config}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ) : viewLayout === 'card' ? (
              <GlobalReferenceCardView
                records={records}
                config={config}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ) : (
              <GlobalReferenceListView
                records={records}
                config={config}
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

      <GlobalReferenceFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        recordId={editingRecordId}
        record={editingRecord}
        config={config}
        isResolving={recordResolving}
        onClose={() => void setRecordParam(null)}
      />

      <GlobalReferenceDeleteDialog
        open={deleteDialogOpen}
        record={deleteRecord}
        config={config}
        isResolving={deleteRecordResolving}
        onClose={() => void setDeleteRecordParam(null)}
      />
    </>
  );
}
