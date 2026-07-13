'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { useQueryState } from 'nuqs';
import {
  AlertCircle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';

import type { DoctorRota } from '@/app/api/lib/modules/doctor-rota/schemas/doctor-rota-schema';
import { ApiError, getApiErrorMessage } from '@/app/queries/api-error';
import { useDoctorRotaQuery } from '@/app/queries/rota-management/useDoctorRota';
import { useDoctorRotasQuery } from '@/app/queries/rota-management/useDoctorRotas';
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

import { DeleteDoctorRotaDialog } from './_modals/delete-doctor-rota-dialog';
import { DoctorRotaFormSheet } from './_sheets/doctor-rota-form-sheet';
import { ViewSkeleton } from './doctor-rota-skeletons';
import { DoctorRotaCardView, DoctorRotaListView, DoctorRotaTableView } from './doctor-rota-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function RotaManagementPageImpl() {
  const [rotaParam, setRotaParam] = useQueryState('rota');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [rotaPendingDelete, setRotaPendingDelete] = useState<DoctorRota | null>(null);

  const rotasQuery = useDoctorRotasQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const rotas = rotasQuery.data?.data ?? [];
  const meta = rotasQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const isCreating = rotaParam === 'new';
  const editingRotaId =
    rotaParam !== null && rotaParam !== 'new' && /^\d+$/.test(rotaParam) ? Number(rotaParam) : null;
  const editingRotaFromList =
    editingRotaId !== null ? (rotas.find((rota) => rota.id === editingRotaId) ?? null) : null;

  const shouldFetchEditingRota =
    editingRotaId !== null && !rotasQuery.isLoading && editingRotaFromList === null;
  const editingRotaQuery = useDoctorRotaQuery(shouldFetchEditingRota ? editingRotaId : null);
  const editingRota = editingRotaFromList ?? editingRotaQuery.data ?? null;

  const editingRotaResolving =
    editingRotaId !== null &&
    editingRota === null &&
    (rotasQuery.isLoading || editingRotaQuery.isFetching);

  const editingRotaNotFound =
    editingRotaQuery.isError &&
    editingRotaQuery.error instanceof ApiError &&
    editingRotaQuery.error.status === 404;
  const editingRotaLoadFailed = editingRotaQuery.isError && !editingRotaNotFound;

  const sheetOpen =
    isCreating ||
    (editingRotaId !== null &&
      (editingRotaResolving || editingRota !== null || editingRotaLoadFailed));

  const previousDebouncedRef = useRef(debouncedSearch);
  useEffect(() => {
    if (previousDebouncedRef.current !== debouncedSearch) {
      previousDebouncedRef.current = debouncedSearch;
      setPage(1);
    }
  }, [debouncedSearch]);

  function openAddSheet() {
    void setRotaParam('new');
  }

  function openEditSheet(rota: DoctorRota) {
    void setRotaParam(String(rota.id));
  }

  function closeSheet() {
    void setRotaParam(null);
  }

  function handleRotaDeleted(rotaId: number) {
    if (editingRotaId === rotaId) {
      closeSheet();
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
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search Doctor Rotas..."
                aria-label="Search Doctor Rotas"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Doctor Rota
              </Button>
            </div>
          </CardContent>
        </Card>

        {rotasQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Doctor Rotas</AlertTitle>
            <AlertDescription>{getApiErrorMessage(rotasQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {rotasQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : rotas.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarClock />
              </EmptyMedia>
              <EmptyTitle>No Doctor Rotas yet</EmptyTitle>
              <EmptyDescription>
                Create reusable time-window templates before assigning Doctor schedules.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={openAddSheet}>
                <Plus className="size-4" />
                Add Doctor Rota
              </Button>
            </EmptyContent>
          </Empty>
        ) : rotas.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Doctor Rotas match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <DoctorRotaTableView
                rotas={rotas}
                onEdit={openEditSheet}
                onDelete={setRotaPendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <DoctorRotaCardView
                rotas={rotas}
                onEdit={openEditSheet}
                onDelete={setRotaPendingDelete}
              />
            ) : (
              <DoctorRotaListView
                rotas={rotas}
                onEdit={openEditSheet}
                onDelete={setRotaPendingDelete}
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

      <DoctorRotaFormSheet
        open={sheetOpen}
        onClose={closeSheet}
        mode={isCreating ? 'new' : 'edit'}
        rota={editingRota}
        loadError={editingRotaLoadFailed}
        onRetryLoad={() => void editingRotaQuery.refetch()}
      />

      <DeleteDoctorRotaDialog
        rota={rotaPendingDelete}
        onClose={() => setRotaPendingDelete(null)}
        onDeleted={handleRotaDeleted}
      />
    </>
  );
}
