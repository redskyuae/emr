'use client';

import { useEffect } from 'react';
import { parseAsInteger, useQueryState } from 'nuqs';

import { useWorkOrderTypesQuery } from '@/app/queries/assets-management/work-orders/useWorkOrderTypes';
import { useWorkOrdersQuery } from '@/app/queries/assets-management/work-orders/useWorkOrders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCount } from '@/lib/format-count';
import { NewWorkOrderSheet } from './_sheets/new-work-order-sheet';
import { MaintenanceStatCardsWidget } from './maintenance-stat-cards';
import { WorkOrderQueueTable } from './work-order-queue-table';
import { WorkOrderQueueToolbar } from './work-order-queue-toolbar';

const PAGE_SIZE = 10;

function parseOptionalId(value: string) {
  return /^\d+$/.test(value) ? Number(value) : undefined;
}

export function MaintenancePageImpl() {
  const [search, setSearch] = useQueryState('q', { defaultValue: '' });
  const [typeParam, setTypeParam] = useQueryState('typeId', { defaultValue: '' });
  const [pageParam, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [workOrderParam, setWorkOrderParam] = useQueryState('work-order');

  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const typeId = parseOptionalId(typeParam);

  const typesQuery = useWorkOrderTypesQuery({ limit: 999 });
  const typeOptions = typesQuery.data?.data ?? [];

  const workOrdersQuery = useWorkOrdersQuery({
    page,
    limit: PAGE_SIZE,
    query: search.trim() ? search.trim() : undefined,
    typeId,
  });

  const workOrders = workOrdersQuery.data?.data ?? [];
  const meta = workOrdersQuery.data?.meta;

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

  const resultSubtitle =
    meta && typesQuery.data
      ? `${formatCount(meta.total, 'Work Order')} across ${formatCount(typesQuery.data.meta.total, 'type')}`
      : undefined;

  return (
    <>
      <div className="space-y-6">
        <MaintenanceStatCardsWidget />

        <div className="space-y-1">
          <h2 className="text-lg leading-tight font-semibold">Work Orders</h2>
          {resultSubtitle ? (
            <p className="text-muted-foreground text-sm">{resultSubtitle}</p>
          ) : null}
        </div>

        <Card className="shadow-fluent-2">
          <CardHeader className="border-b">
            <div>
              <CardTitle>Maintenance queue</CardTitle>
              <CardDescription>Work Orders raised against tracked Assets.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <WorkOrderQueueToolbar
              search={search}
              onSearchChange={(value) => {
                void setSearch(value || null);
                goToFirstPage();
              }}
              typeOptions={typeOptions}
              typeValue={typeParam}
              onTypeChange={(value) => {
                void setTypeParam(value || null);
                goToFirstPage();
              }}
              onNewWorkOrder={() => void setWorkOrderParam('new')}
            />

            <WorkOrderQueueTable
              workOrders={workOrders}
              meta={meta}
              isLoading={workOrdersQuery.isLoading}
              isFetching={workOrdersQuery.isFetching}
              isError={workOrdersQuery.isError}
              error={workOrdersQuery.error}
              hasActiveFilters={Boolean(search.trim() || typeId)}
              page={page}
              onPageChange={(next) => void setPage(next)}
            />
          </CardContent>
        </Card>
      </div>

      <NewWorkOrderSheet open={workOrderParam === 'new'} />
    </>
  );
}
