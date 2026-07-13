'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { useDebouncedValue } from '@tanstack/react-pacer';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Gauge,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
} from 'lucide-react';
import type { AssetCondition } from '@/app/api/lib/modules/asset-condition/schemas/asset-condition-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAssetConditionQuery } from '@/app/queries/asset-masters/asset-conditions/useAssetCondition';
import { useAssetConditionsQuery } from '@/app/queries/asset-masters/asset-conditions/useAssetConditions';
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
import { AssetConditionDeleteDialog } from './_modals/asset-condition-delete-dialog';
import { AssetConditionFormSheet } from './_sheets/asset-condition-form-sheet';
import { ViewSkeleton } from './asset-condition-skeletons';
import {
  AssetConditionCardView,
  AssetConditionListView,
  AssetConditionTableView,
} from './asset-condition-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function AssetConditionPageImpl() {
  const [conditionParam, setConditionParam] = useQueryState('condition');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [conditionPendingDelete, setConditionPendingDelete] = useState<AssetCondition | null>(null);

  const isCreating = conditionParam === 'new';
  const editingConditionId =
    conditionParam !== null && conditionParam !== 'new' && /^\d+$/.test(conditionParam)
      ? Number(conditionParam)
      : null;

  const conditionsQuery = useAssetConditionsQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const conditions = conditionsQuery.data?.data ?? [];
  const meta = conditionsQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingConditionFromList =
    editingConditionId !== null
      ? (conditions.find((c) => c.id === editingConditionId) ?? null)
      : null;

  const shouldFetchEditingCondition =
    editingConditionId !== null && !conditionsQuery.isLoading && editingConditionFromList === null;
  const editingConditionQuery = useAssetConditionQuery(
    shouldFetchEditingCondition ? editingConditionId : null
  );
  const editingCondition = editingConditionFromList ?? editingConditionQuery.data ?? null;

  const conditionResolving =
    editingConditionId !== null &&
    editingCondition === null &&
    (conditionsQuery.isLoading || editingConditionQuery.isFetching);
  const sheetOpen =
    isCreating ||
    (editingConditionId !== null && (conditionResolving || editingCondition !== null));

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
                placeholder="Search asset conditions..."
                aria-label="Search asset conditions"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={() => void setConditionParam('new')}>
                <Plus className="size-4" />
                Add Asset Condition
              </Button>
            </div>
          </CardContent>
        </Card>

        {conditionsQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Asset Conditions</AlertTitle>
            <AlertDescription>{getApiErrorMessage(conditionsQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {conditionsQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : conditions.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Gauge />
              </EmptyMedia>
              <EmptyTitle>No Asset Conditions yet</EmptyTitle>
              <EmptyDescription>
                Create Asset Conditions to grade the physical condition of equipment and assets in
                this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setConditionParam('new')}>
                <Plus className="size-4" />
                Add Asset Condition
              </Button>
            </EmptyContent>
          </Empty>
        ) : conditions.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Asset Conditions match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <AssetConditionTableView
                conditions={conditions}
                onEdit={(condition) => void setConditionParam(String(condition.id))}
                onDelete={setConditionPendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <AssetConditionCardView
                conditions={conditions}
                onEdit={(condition) => void setConditionParam(String(condition.id))}
                onDelete={setConditionPendingDelete}
              />
            ) : (
              <AssetConditionListView
                conditions={conditions}
                onEdit={(condition) => void setConditionParam(String(condition.id))}
                onDelete={setConditionPendingDelete}
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

      <AssetConditionFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        conditionId={editingConditionId}
        condition={editingCondition}
        isResolving={conditionResolving}
        onClose={() => void setConditionParam(null)}
      />

      <AssetConditionDeleteDialog
        condition={conditionPendingDelete}
        onClose={() => setConditionPendingDelete(null)}
        onDeleted={(deletedId) => {
          if (editingConditionId === deletedId) {
            void setConditionParam(null);
          }
        }}
      />
    </>
  );
}
