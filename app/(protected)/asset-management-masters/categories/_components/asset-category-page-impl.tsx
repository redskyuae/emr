'use client';

import { useState } from 'react';
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
  Tag,
} from 'lucide-react';
import type { AssetCategory } from '@/app/api/lib/modules/asset-category/schemas/asset-category-schema';
import { getApiErrorMessage } from '@/app/queries/api-error';
import { useAssetCategoriesQuery } from '@/app/queries/asset-masters/useAssetCategories';
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
import { AssetCategoryDeleteDialog } from './_modals/asset-category-delete-dialog';
import { AssetCategoryFormSheet } from './_sheets/asset-category-form-sheet';
import { ViewSkeleton } from './asset-category-skeletons';
import {
  AssetCategoryCardView,
  AssetCategoryListView,
  AssetCategoryTableView,
} from './asset-category-views';

type ViewLayout = 'table' | 'card' | 'list';

const PAGE_SIZE = 10;

export function AssetCategoryPageImpl() {
  const [categoryParam, setCategoryParam] = useQueryState('category');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchTerm, { wait: 300 });
  const [page, setPage] = useState(1);
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<AssetCategory | null>(null);

  const isCreating = categoryParam === 'new';
  const editingCategoryId =
    categoryParam !== null && categoryParam !== 'new' && /^\d+$/.test(categoryParam)
      ? Number(categoryParam)
      : null;

  const categoriesQuery = useAssetCategoriesQuery({
    query: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const categories = categoriesQuery.data?.data ?? [];
  const meta = categoriesQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 0;
  const total = meta?.total ?? 0;
  const rangeStart = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const editingCategory =
    editingCategoryId !== null
      ? (categories.find((c) => c.id === editingCategoryId) ?? null)
      : null;

  const sheetOpen =
    isCreating ||
    (editingCategoryId !== null && (categoriesQuery.isLoading || editingCategory !== null));
  const categoryResolving = sheetOpen && !isCreating && editingCategory === null;

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
                placeholder="Search asset categories..."
                aria-label="Search asset categories"
              />
            </InputGroup>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end lg:ml-auto">
              <Button type="button" size="lg" onClick={() => void setCategoryParam('new')}>
                <Plus className="size-4" />
                Add Asset Category
              </Button>
            </div>
          </CardContent>
        </Card>

        {categoriesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Could not load Asset Categories</AlertTitle>
            <AlertDescription>{getApiErrorMessage(categoriesQuery.error)}</AlertDescription>
          </Alert>
        ) : null}

        {categoriesQuery.isLoading ? (
          <ViewSkeleton layout={viewLayout} />
        ) : categories.length === 0 && !debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Tag />
              </EmptyMedia>
              <EmptyTitle>No Asset Categories yet</EmptyTitle>
              <EmptyDescription>
                Create Asset Categories to classify the equipment and assets tracked in this Tenant.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button type="button" onClick={() => void setCategoryParam('new')}>
                <Plus className="size-4" />
                Add Asset Category
              </Button>
            </EmptyContent>
          </Empty>
        ) : categories.length === 0 && debouncedSearch ? (
          <Empty className="bg-card shadow-fluent-2 min-h-72 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>No results found</EmptyTitle>
              <EmptyDescription>
                No Asset Categories match &ldquo;{debouncedSearch}&rdquo;. Try a different search
                term.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {viewLayout === 'table' ? (
              <AssetCategoryTableView
                categories={categories}
                onEdit={(category) => void setCategoryParam(String(category.id))}
                onDelete={setCategoryPendingDelete}
              />
            ) : viewLayout === 'card' ? (
              <AssetCategoryCardView
                categories={categories}
                onEdit={(category) => void setCategoryParam(String(category.id))}
                onDelete={setCategoryPendingDelete}
              />
            ) : (
              <AssetCategoryListView
                categories={categories}
                onEdit={(category) => void setCategoryParam(String(category.id))}
                onDelete={setCategoryPendingDelete}
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

      <AssetCategoryFormSheet
        open={sheetOpen}
        mode={isCreating ? 'new' : 'edit'}
        categoryId={editingCategoryId}
        category={editingCategory}
        isResolving={categoryResolving}
        onClose={() => void setCategoryParam(null)}
      />

      <AssetCategoryDeleteDialog
        category={categoryPendingDelete}
        onClose={() => setCategoryPendingDelete(null)}
        onDeleted={(deletedId) => {
          if (editingCategoryId === deletedId) {
            void setCategoryParam(null);
          }
        }}
      />
    </>
  );
}
