'use client';

import { useEffect } from 'react';
import { parseAsInteger, useQueryState } from 'nuqs';

import { useAssetCategoriesQuery } from '@/app/queries/asset-masters/useAssetCategories';
import { useAssetStatusesQuery } from '@/app/queries/asset-masters/asset-statuses/useAssetStatuses';
import { useAssetsQuery } from '@/app/queries/assets-management/useAssets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetDirectoryTable } from './asset-directory-table';
import { InventoryToolbar } from './inventory-toolbar';
import { AddAssetSheet } from './_sheets/add-asset-sheet';

const PAGE_SIZE = 10;

function parseOptionalId(value: string) {
  return /^\d+$/.test(value) ? Number(value) : undefined;
}

export function InventoryPageImpl() {
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [categoryParam, setCategoryParam] = useQueryState('categoryId', { defaultValue: '' });
  const [statusParam, setStatusParam] = useQueryState('statusId', { defaultValue: '' });
  const [pageParam, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [assetParam, setAssetParam] = useQueryState('asset');

  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const categoryId = parseOptionalId(categoryParam);
  const statusId = parseOptionalId(statusParam);

  const categoriesQuery = useAssetCategoriesQuery({ limit: 999 });
  const statusesQuery = useAssetStatusesQuery({ limit: 999 });
  const categoryOptions = categoriesQuery.data?.data ?? [];
  const statusOptions = statusesQuery.data?.data ?? [];

  const assetsQuery = useAssetsQuery({
    page,
    limit: PAGE_SIZE,
    query: search.trim() ? search.trim() : undefined,
    categoryId,
    statusId,
  });

  const assets = assetsQuery.data?.data ?? [];
  const meta = assetsQuery.data?.meta;

  useEffect(() => {
    if (pageParam !== page) {
      void setPage(page);
      return;
    }

    if (meta?.totalPages && page > meta.totalPages) {
      void setPage(meta.totalPages);
    }
  }, [meta?.totalPages, page, pageParam, setPage]);

  function goToFirstPage() {
    void setPage(1);
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="shadow-fluent-2">
          <CardHeader className="border-b">
            <div>
              <CardTitle>Asset directory</CardTitle>
              <CardDescription>Tracked Assets across Facilities and departments.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <InventoryToolbar
              search={search}
              onSearchChange={(value) => {
                void setSearch(value || null);
                goToFirstPage();
              }}
              categoryOptions={categoryOptions}
              categoryValue={categoryParam}
              onCategoryChange={(value) => {
                void setCategoryParam(value || null);
                goToFirstPage();
              }}
              statusOptions={statusOptions}
              statusValue={statusParam}
              onStatusChange={(value) => {
                void setStatusParam(value || null);
                goToFirstPage();
              }}
              onAddAsset={() => void setAssetParam('new')}
            />

            <AssetDirectoryTable
              assets={assets}
              meta={meta}
              isLoading={assetsQuery.isLoading}
              isFetching={assetsQuery.isFetching}
              isError={assetsQuery.isError}
              error={assetsQuery.error}
              hasActiveFilters={Boolean(search.trim() || categoryId || statusId)}
              page={page}
              onPageChange={(next) => void setPage(next)}
            />
          </CardContent>
        </Card>
      </div>

      <AddAssetSheet open={assetParam === 'new'} onClose={() => void setAssetParam(null)} />
    </>
  );
}
