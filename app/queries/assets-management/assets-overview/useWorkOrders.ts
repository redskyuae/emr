'use client';

import { useQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { WorkOrder } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import type { ListWorkOrdersResponse } from '@/app/api/v1/work-orders/types';

type WorkOrdersParams = {
  query?: string;
  page?: number;
  limit?: number;
};

const workOrdersQueryKey = ['work-orders'] as const;

const workOrdersParamQueryKey = (params: WorkOrdersParams) =>
  [...workOrdersQueryKey, params] as const;

async function fetchWorkOrders(params: WorkOrdersParams): Promise<ListWorkOrdersResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.query) searchParams.set('query', params.query);

  const response = await fetch(`/api/v1/work-orders?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Work Orders');
  }

  return response.json() as Promise<ListWorkOrdersResponse>;
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

function selectAttentionWorkOrders(response: ListWorkOrdersResponse) {
  return response.data.filter(isAttentionWorkOrder);
}

function selectUpcomingMaintenanceWorkOrders(response: ListWorkOrdersResponse) {
  return response.data
    .filter(
      (workOrder) =>
        workOrder.status.category === 'SCHEDULED' || workOrder.status.category === 'IN_PROGRESS'
    )
    .sort(compareDueDate)
    .slice(0, 5);
}

export function useAttentionWorkOrdersQuery(params: WorkOrdersParams) {
  return useQuery({
    queryKey: workOrdersParamQueryKey(params),
    queryFn: () => fetchWorkOrders(params),
    select: selectAttentionWorkOrders,
  });
}

export function useUpcomingMaintenanceWorkOrdersQuery(params: WorkOrdersParams) {
  return useQuery({
    queryKey: workOrdersParamQueryKey(params),
    queryFn: () => fetchWorkOrders(params),
    select: selectUpcomingMaintenanceWorkOrders,
  });
}
