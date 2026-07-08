'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAssetStatusQuery } from '@/app/queries/asset-masters/asset-statuses/useAssetStatus';
import { useAssetStatusesQuery } from '@/app/queries/asset-masters/asset-statuses/useAssetStatuses';
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
import { AssetStatusDeleteDialog } from './_modals/asset-status-delete-dialog';
import { AssetStatusFormSheet } from './_sheets/asset-status-form-sheet';
import { ViewSkeleton } from './asset-status-skeletons';
import {
  AssetStatusCardView,
  AssetStatusListView,
  AssetStatusTableView,
} from './asset-status-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function AssetStatusPageImpl() {
  const [statusParam, setStatusParam] = useQueryState('status');
  const [deleteStatusParam, setDeleteStatusParam] = useQueryState('deleteStatus');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);

  const isCreating = statusParam === 'new';
  const editingStatusId =
    statusParam !== null && statusParam !== 'new' && /^\d+$/.test(statusParam)
      ? Number(statusParam)
      : null;
  const deleteStatusId =
    deleteStatusParam !== null && /^\d+$/.test(deleteStatusParam)
      ? Number(deleteStatusParam)
      : null;

  const statusesQuery = useAssetStatusesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const statuses = statusesQuery.data?.data ?? [];
  const meta = statusesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingStatusFromList =
    editingStatusId !== null ? (statuses.find((s) => s.id === editingStatusId) ?? null) : null;
  const statusPendingDelete =
    deleteStatusId !== null ? (statuses.find((s) => s.id === deleteStatusId) ?? null) : null;

  const shouldFetchEditingStatus =
    editingStatusId !== null && !statusesQuery.isLoading && editingStatusFromList === null;
  const editingStatusQuery = useAssetStatusQuery(shouldFetchEditingStatus ? editingStatusId : null);
  const editingStatus = editingStatusFromList ?? editingStatusQuery.data ?? null;

  const statusResolving =
    editingStatusId !== null &&
    editingStatus === null &&
    (statusesQuery.isLoading || editingStatusQuery.isFetching);
  const sheetOpen =
    isCreating || (editingStatusId !== null && (statusResolving || editingStatus !== null));

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
                placeholder="Search asset statuses..."
                aria-label="Search asset statuses"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={() => void setStatusParam('new')}>
                <Plus className="size-4" />
                Add Asset Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {statusesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Asset Statuses</AlertTitle>
            <AlertDescription>{getApiErrorMessage(statusesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {statusesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : statuses.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Activity />
              </EmptyMedia>
              <EmptyTitle>No Asset Statuses yet</EmptyTitle>
              <EmptyDescription>
                Create Asset Statuses to track the operational lifecycle state of equipment and
                assets in this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setStatusParam('new')}>
                <Plus className="size-4" />
                Add Asset Status
              </Button>
            </EmptyContent>
          </Empty>
        ) : statuses.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Asset Statuses match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <AssetStatusTableView
                statuses={statuses}
                onEdit={(status) => void setStatusParam(String(status.id))}
                onDelete={(status) => void setDeleteStatusParam(String(status.id))}
              />
            ) : viewLayout === 'card' ? (
              <AssetStatusCardView
                statuses={statuses}
                onEdit={(status) => void setStatusParam(String(status.id))}
                onDelete={(status) => void setDeleteStatusParam(String(status.id))}
              />
            ) : (
              <AssetStatusListView
                statuses={statuses}
                onEdit={(status) => void setStatusParam(String(status.id))}
                onDelete={(status) => void setDeleteStatusParam(String(status.id))}
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

      <AssetStatusFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        statusId={editingStatusId}
        status={editingStatus}
        isResolving={statusResolving}
        onClose={() => void setStatusParam(null)}
      />

      <AssetStatusDeleteDialog
        status={statusPendingDelete}
        onClose={() => void setDeleteStatusParam(null)}
        onDeleted={(deletedId) => {
          if (editingStatusId === deletedId) {
            void setStatusParam(null);
          }
        }}
      />
    </>
  );
}
