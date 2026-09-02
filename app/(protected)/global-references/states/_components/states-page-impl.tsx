'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MapPinned,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/app/queries/api-error';
import { useCountryOptionsQuery } from '@/app/queries/global-references/countries/useCountries';
import { type State, useStatesQuery } from '@/app/queries/global-references/states/useStates';
import { useStateQuery } from '@/app/queries/global-references/states/useState';
import { useDeleteState } from '@/app/queries/global-references/states/useDeleteState';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { StateDeleteDialog } from './_modals/delete-state-dialog';
import { StateFormSheet } from './_sheets/state-form-sheet';
import { ViewSkeleton } from './state-skeletons';
import { StateCardView, StateListView, StateTableView } from './state-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

function getNumericParam(value: string | null) {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

function StateCountryFilter({
  countries,
  isLoading,
  value,
  onChange,
}: {
  countries: { id: number; name: string }[];
  isLoading: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading || countries.length === 0}>
      <SelectTrigger className="bg-background h-9 w-full lg:w-52" aria-label="Filter by Country">
        <SelectValue placeholder={isLoading ? 'Loading Countries...' : 'All Countries'} />
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

export function StatesPageImpl() {
  const [recordParam, setRecordParam] = useQueryState('state');
  const [deleteRecordParam, setDeleteRecordParam] = useQueryState('stateDelete');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const deleteMutation = useDeleteState();
  const countriesQuery = useCountryOptionsQuery();
  const countries = countriesQuery.data ?? [];

  const { data: canCreate } = useHasPermission('state:create');
  const { data: canUpdate } = useHasPermission('state:update');
  const { data: canDelete } = useHasPermission('state:delete');

  const isCreating = recordParam === 'new' && canCreate;
  const editingRecordId = recordParam !== 'new' ? getNumericParam(recordParam) : null;
  const deleteRecordId = getNumericParam(deleteRecordParam);
  const countryId = countryFilter !== 'all' ? Number(countryFilter) : undefined;
  const selectedCountry = countries.find((country) => country.id === countryId) ?? null;
  const selectedCountryName = selectedCountry?.name ?? `Country ${countryFilter}`;
  const hasActiveFilter = Boolean(debouncedSearch) || countryFilter !== 'all';

  const statesQuery = useStatesQuery({
    page,
    countryId,
    limit: PAGE_SIZE,
    query: debouncedSearch || undefined,
  });

  const states = statesQuery.data?.data ?? [];
  const meta = statesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingStateFromList =
    editingRecordId !== null
      ? (states.find((state) => state.id === editingRecordId) ?? null)
      : null;
  const deleteStateFromList =
    deleteRecordId !== null ? (states.find((state) => state.id === deleteRecordId) ?? null) : null;

  const shouldFetchEditingState =
    editingRecordId !== null && !statesQuery.isLoading && editingStateFromList === null;
  const editingStateQuery = useStateQuery(shouldFetchEditingState ? editingRecordId : null);
  const editingState = editingStateFromList ?? editingStateQuery.data ?? null;

  const shouldFetchDeleteState =
    deleteRecordId !== null && !statesQuery.isLoading && deleteStateFromList === null;
  const deleteStateQuery = useStateQuery(shouldFetchDeleteState ? deleteRecordId : null);
  const deleteState = deleteStateFromList ?? deleteStateQuery.data ?? null;

  const recordResolving =
    editingRecordId !== null &&
    editingState === null &&
    (statesQuery.isLoading || editingStateQuery.isFetching);
  const sheetOpen =
    isCreating || (editingRecordId !== null && (recordResolving || editingState !== null));

  const deleteRecordResolving =
    deleteRecordId !== null &&
    deleteState === null &&
    (statesQuery.isLoading || deleteStateQuery.isFetching);
  const deleteDialogOpen =
    deleteRecordId !== null && (deleteRecordResolving || deleteState !== null);

  function openEdit(state: State) {
    void setRecordParam(String(state.id));
  }

  function openDelete(state: State) {
    void setDeleteRecordParam(String(state.id));
  }

  function updateSearchTerm(value: string) {
    setSearchTerm(value);
    setPage(1);
  }

  function updateCountryFilter(value: string) {
    setCountryFilter(value);
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleteState) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(deleteState.id);
      toast.success('State deleted.');
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
                placeholder="Search states..."
                aria-label="Search states"
              />
            </InputGroup>
            <StateCountryFilter
              countries={countries}
              isLoading={countriesQuery.isLoading}
              value={countryFilter}
              onChange={updateCountryFilter}
            />

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" size="lg" onClick={() => void setRecordParam('new')}>
                  <Plus className="size-4" />
                  Add State
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {statesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load States</AlertTitle>
            <AlertDescription>{getApiErrorMessage(statesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {statesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : states.length === 0 && !hasActiveFilter ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MapPinned />
              </EmptyMedia>
              <EmptyTitle>No States yet</EmptyTitle>
              <EmptyDescription>
                Create States under Countries for address context.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate ? (
              <EmptyContent>
                <Button type="button" onClick={() => void setRecordParam('new')}>
                  <Plus className="size-4" />
                  Add State
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : states.length === 0 && hasActiveFilter ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                {debouncedSearch && countryFilter !== 'all' ? (
                  <>
                    No States match &ldquo;{debouncedSearch}&rdquo; in Country &ldquo;
                    {selectedCountryName}&rdquo;. Try a different search term or Country.
                  </>
                ) : debouncedSearch ? (
                  <>No States match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.</>
                ) : (
                  <>
                    No States found for Country &ldquo;{selectedCountryName}&rdquo;. Try a different
                    Country or clear the filter.
                  </>
                )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <StateTableView
                states={states}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ) : viewLayout === 'card' ? (
              <StateCardView
                states={states}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={openEdit}
                onDelete={openDelete}
              />
            ) : (
              <StateListView
                states={states}
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

      <StateFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        recordId={editingRecordId}
        record={editingState}
        isResolving={recordResolving}
        onClose={() => void setRecordParam(null)}
      />

      <StateDeleteDialog
        state={deleteDialogOpen ? deleteState : null}
        isDeleting={deleteMutation.isPending || deleteRecordResolving}
        onConfirm={() => void confirmDelete()}
        onCancel={() => void setDeleteRecordParam(null)}
      />
    </>
  );
}
