import type { WorkOrder } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListWorkOrdersResponse = Paginated<WorkOrder>;

export type CreateWorkOrderRequest = {
  assetId: number;
  typeId: number;
  priorityId: number;
  statusId: number;
  technician?: string | null;
  dueDate?: string | null;
  note?: string | null;
};

export type CreateWorkOrderResponse = {
  data: WorkOrder;
};
