'use client';

import { queryOptions } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { WorkOrder } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import type { ListWorkOrdersResponse } from '@/app/api/v1/work-orders/types';

type WorkOrdersParams = {
  query?: string;
  limit?: number;
};

const workOrdersQueryKey = ['work-orders'] as const;

const workOrdersParamQueryKey = (params: WorkOrdersParams) =>
  [...workOrdersQueryKey, params] as const;

async function fetchWorkOrdersPage(
  params: WorkOrdersParams & { page: number }
): Promise<ListWorkOrdersResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('page', String(params.page));
  searchParams.set('limit', String(params.limit ?? 999));
  if (params.query) searchParams.set('query', params.query);

  const response = await fetch(`/api/v1/work-orders?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Work Orders');
  }

  return response.json() as Promise<ListWorkOrdersResponse>;
}

async function fetchAllWorkOrders(params: WorkOrdersParams): Promise<WorkOrder[]> {
  const firstPage = await fetchWorkOrdersPage({ ...params, page: 1 });
  const workOrders = [...firstPage.data];

  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    const nextPage = await fetchWorkOrdersPage({ ...params, page });
    workOrders.push(...nextPage.data);
  }

  return workOrders;
}

function isAttentionWorkOrder(workOrder: WorkOrder) {
  if (workOrder.status.category === 'COMPLETED') {
    return false;
  }

  return (
    workOrder.status.category === 'OVERDUE' || workOrder.priority.name.toLowerCase() === 'critical'
  );
}

function compareDueDate(a: WorkOrder, b: WorkOrder) {
  if (!a.dueDate && !b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return a.dueDate.localeCompare(b.dueDate);
}

const ATTENTION_DISPLAY_LIMIT = 10;

function selectAttentionWorkOrders(workOrders: WorkOrder[]) {
  const attentionWorkOrders = workOrders.filter(isAttentionWorkOrder).sort(compareDueDate);

  return {
    items: attentionWorkOrders.slice(0, ATTENTION_DISPLAY_LIMIT),
    total: attentionWorkOrders.length,
  };
}

function selectUpcomingMaintenanceWorkOrders(workOrders: WorkOrder[]) {
  return workOrders
    .filter(
      (workOrder) =>
        workOrder.status.category === 'SCHEDULED' || workOrder.status.category === 'IN_PROGRESS'
    )
    .sort(compareDueDate)
    .slice(0, 5);
}

export const attentionWorkOrdersQueryOptions = (params: WorkOrdersParams) =>
  queryOptions({
    queryKey: workOrdersParamQueryKey(params),
    queryFn: () => fetchAllWorkOrders(params),
    select: selectAttentionWorkOrders,
  });

export const upcomingMaintenanceWorkOrdersQueryOptions = (params: WorkOrdersParams) =>
  queryOptions({
    queryKey: workOrdersParamQueryKey(params),
    queryFn: () => fetchAllWorkOrders(params),
    select: selectUpcomingMaintenanceWorkOrders,
  });
