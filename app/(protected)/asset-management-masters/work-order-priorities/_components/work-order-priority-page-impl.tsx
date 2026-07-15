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
import type { WorkOrderPriority } from '@/app/api/lib/modules/work-order-priority/schemas/work-order-priority-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useWorkOrderPriorityQuery } from '@/app/queries/asset-masters/work-order-priorities/useWorkOrderPriority';
import { useWorkOrderPrioritiesQuery } from '@/app/queries/asset-masters/work-order-priorities/useWorkOrderPriorities';
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
import { WorkOrderPriorityDeleteDialog } from './_modals/work-order-priority-delete-dialog';
import { WorkOrderPriorityFormSheet } from './_sheets/work-order-priority-form-sheet';
import { ViewSkeleton } from './work-order-priority-skeletons';
import {
  WorkOrderPriorityCardView,
  WorkOrderPriorityListView,
  WorkOrderPriorityTableView,
} from './work-order-priority-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function WorkOrderPriorityPageImpl() {
  const [priorityParam, setPriorityParam] = useQueryState('work-order-priority');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [priorityPendingDelete, setPriorityPendingDelete] = useState<WorkOrderPriority | null>(
    null
  );

  const isCreating = priorityParam === 'new';
  const editingPriorityId =
    priorityParam !== null && priorityParam !== 'new' && /^\d+$/.test(priorityParam)
      ? Number(priorityParam)
      : null;

  const prioritiesQuery = useWorkOrderPrioritiesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const priorities = prioritiesQuery.data?.data ?? [];
  const meta = prioritiesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingPriorityFromList =
    editingPriorityId !== null
      ? (priorities.find((p) => p.id === editingPriorityId) ?? null)
      : null;

  const shouldFetchEditingPriority =
    editingPriorityId !== null && !prioritiesQuery.isLoading && editingPriorityFromList === null;
  const editingPriorityQuery = useWorkOrderPriorityQuery(
    shouldFetchEditingPriority ? editingPriorityId : null
  );
  const editingPriority = editingPriorityFromList ?? editingPriorityQuery.data ?? null;

  const priorityResolving =
    editingPriorityId !== null &&
    editingPriority === null &&
    (prioritiesQuery.isLoading || editingPriorityQuery.isFetching);
  const sheetOpen =
    isCreating || (editingPriorityId !== null && (priorityResolving || editingPriority !== null));

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
                placeholder="Search work order priorities..."
                aria-label="Search work order priorities"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={() => void setPriorityParam('new')}>
                <Plus className="size-4" />
                Add Work Order Priority
              </Button>
            </div>
          </CardContent>
        </Card>

        {prioritiesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Work Order Priorities</AlertTitle>
            <AlertDescription>{getApiErrorMessage(prioritiesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {prioritiesQuery.isError ? null : prioritiesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : priorities.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Flag />
              </EmptyMedia>
              <EmptyTitle>No Work Order Priorities yet</EmptyTitle>
              <EmptyDescription>
                Create Work Order Priorities to rank the urgency of Work Orders in this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setPriorityParam('new')}>
                <Plus className="size-4" />
                Add Work Order Priority
              </Button>
            </EmptyContent>
          </Empty>
        ) : priorities.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Work Order Priorities match &ldquo;{debouncedSearch}&rdquo;. Try a different
                search term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <WorkOrderPriorityTableView
                priorities={priorities}
                onEdit={(priority) => void setPriorityParam(String(priority.id))}
                onDelete={setPriorityPendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <WorkOrderPriorityCardView
                priorities={priorities}
                onEdit={(priority) => void setPriorityParam(String(priority.id))}
                onDelete={setPriorityPendingDelete}
              />
            ) : (
              <WorkOrderPriorityListView
                priorities={priorities}
                onEdit={(priority) => void setPriorityParam(String(priority.id))}
                onDelete={setPriorityPendingDelete}
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

      <WorkOrderPriorityFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        priorityId={editingPriorityId}
        priority={editingPriority}
        isResolving={priorityResolving}
        onClose={() => void setPriorityParam(null)}
      />

      <WorkOrderPriorityDeleteDialog
        priority={priorityPendingDelete}
        onClose={() => setPriorityPendingDelete(null)}
        onDeleted={(deletedId) => {
          if (editingPriorityId === deletedId) {
            void setPriorityParam(null);
          }
          if (priorities.length === 1 && page > 1) {
            setPage((p) => p - 1);
          }
        }}
      />
    </>
  );
}
