'use client';

import { useEffect, useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
  Wrench,
} from 'lucide-react';
import type { WorkOrderType } from '@/app/api/lib/modules/work-order-type/schemas/work-order-type-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useWorkOrderTypeQuery } from '@/app/queries/asset-masters/work-order-types/useWorkOrderType';
import { useWorkOrderTypesQuery } from '@/app/queries/asset-masters/work-order-types/useWorkOrderTypes';
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
import { WorkOrderTypeDeleteDialog } from './_modals/work-order-type-delete-dialog';
import { WorkOrderTypeFormSheet } from './_sheets/work-order-type-form-sheet';
import { ViewSkeleton } from './work-order-type-skeletons';
import {
  WorkOrderTypeCardView,
  WorkOrderTypeListView,
  WorkOrderTypeTableView,
} from './work-order-type-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function WorkOrderTypePageImpl() {
  const [typeParam, setTypeParam] = useQueryState('work-order-type');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [typePendingDelete, setTypePendingDelete] = useState<WorkOrderType | null>(null);

  const { data: canCreate, isLoading: canCreateLoading } =
    useHasPermission('work-order-type:create');
  const { data: canUpdate, isLoading: canUpdateLoading } =
    useHasPermission('work-order-type:update');
  const { data: canDelete } = useHasPermission('work-order-type:delete');

  const isCreating = typeParam === 'new' && canCreate;
  const editingTypeId =
    typeParam !== null && typeParam !== 'new' && /^\d+$/.test(typeParam) ? Number(typeParam) : null;

  const typesQuery = useWorkOrderTypesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const types = typesQuery.data?.data ?? [];
  const meta = typesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingTypeFromList =
    editingTypeId !== null ? (types.find((t) => t.id === editingTypeId) ?? null) : null;

  const shouldFetchEditingType =
    editingTypeId !== null && !typesQuery.isLoading && editingTypeFromList === null;
  const editingTypeQuery = useWorkOrderTypeQuery(shouldFetchEditingType ? editingTypeId : null);
  const editingType = editingTypeFromList ?? editingTypeQuery.data ?? null;

  const typeResolving =
    editingTypeId !== null &&
    editingType === null &&
    (typesQuery.isLoading || editingTypeQuery.isFetching);
  const sheetOpen =
    isCreating || (canUpdate && editingTypeId !== null && (typeResolving || editingType !== null));

  const typeAccessDenied =
    (typeParam === 'new' && !canCreateLoading && !canCreate) ||
    (editingTypeId !== null && !canUpdateLoading && !canUpdate);

  useEffect(() => {
    if (typeAccessDenied) {
      void setTypeParam(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeAccessDenied]);

  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  if (prevSearch !== debouncedSearch) {
    setPrevSearch(debouncedSearch);
    if (page !== 1) setPage(1);
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
                placeholder="Search work order types..."
                aria-label="Search work order types"
              />
            </InputGroup>

            {canCreate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
                <Button type="button" size="lg" onClick={() => void setTypeParam('new')}>
                  <Plus className="size-4" />
                  Add Work Order Type
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {typesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Work Order Types</AlertTitle>
            <AlertDescription>{getApiErrorMessage(typesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {typesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : types.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wrench />
              </EmptyMedia>
              <EmptyTitle>No Work Order Types yet</EmptyTitle>
              <EmptyDescription>
                Create Work Order Types to classify the nature of maintenance work in this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            {canCreate ? (
              <EmptyContent>
                <Button type="button" onClick={() => void setTypeParam('new')}>
                  <Plus className="size-4" />
                  Add Work Order Type
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        ) : types.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Work Order Types match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <WorkOrderTypeTableView
                types={types}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={(type) => void setTypeParam(String(type.id))}
                onDelete={setTypePendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <WorkOrderTypeCardView
                types={types}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={(type) => void setTypeParam(String(type.id))}
                onDelete={setTypePendingDelete}
              />
            ) : (
              <WorkOrderTypeListView
                types={types}
                canEdit={canUpdate}
                canDelete={canDelete}
                onEdit={(type) => void setTypeParam(String(type.id))}
                onDelete={setTypePendingDelete}
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
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
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

      <WorkOrderTypeFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        typeId={editingTypeId}
        type={editingType}
        isResolving={typeResolving}
        onClose={() => void setTypeParam(null)}
      />

      <WorkOrderTypeDeleteDialog
        type={canDelete ? typePendingDelete : null}
        onClose={() => setTypePendingDelete(null)}
        onDeleted={(deletedId) => {
          if (editingTypeId === deletedId) {
            void setTypeParam(null);
          }
          if (types.length === 1 && page > 1) {
            setPage((p) => p - 1);
          }
        }}
      />
    </>
  );
}
