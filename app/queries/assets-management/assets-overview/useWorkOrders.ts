import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { parseApiError } from '@/app/queries/api-error';
import type { WorkOrder } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import type { ListWorkOrdersResponse } from '@/app/api/v1/work-orders/types';

const ATTENTION_DISPLAY_LIMIT = 10;
const UPCOMING_MAINTENANCE_DISPLAY_LIMIT = 5;

async function fetchRecentWorkOrders(limit: number): Promise<WorkOrder[]> {
  const searchParams = new URLSearchParams({ page: '1', limit: String(limit) });

  const response = await fetch(`/api/v1/work-orders?${searchParams.toString()}`, {
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await parseApiError(response, 'Could not load Work Orders');
  }

  const result = (await response.json()) as ListWorkOrdersResponse;
  return result.data;
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

function selectAttentionWorkOrders(workOrders: WorkOrder[]) {
  return workOrders.filter(isAttentionWorkOrder).sort(compareDueDate);
}

function selectUpcomingMaintenanceWorkOrders(workOrders: WorkOrder[]) {
  return workOrders
    .filter(
      (workOrder) =>
        workOrder.status.category === 'SCHEDULED' || workOrder.status.category === 'IN_PROGRESS'
    )
    .sort(compareDueDate);
}

export function useSuspenseAttentionWorkOrders() {
  return useSuspenseQuery(
    queryOptions({
      queryKey: ['work-orders', 'attention', ATTENTION_DISPLAY_LIMIT] as const,
      queryFn: () => fetchRecentWorkOrders(ATTENTION_DISPLAY_LIMIT),
      select: selectAttentionWorkOrders,
    })
  );
}

export function useSuspenseUpcomingMaintenanceWorkOrders() {
  return useSuspenseQuery(
    queryOptions({
      queryKey: ['work-orders', 'upcoming-maintenance', UPCOMING_MAINTENANCE_DISPLAY_LIMIT] as const,
      queryFn: () => fetchRecentWorkOrders(UPCOMING_MAINTENANCE_DISPLAY_LIMIT),
      select: selectUpcomingMaintenanceWorkOrders,
    })
  );
}
