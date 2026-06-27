import type {
  WorkOrderStatus,
  WorkOrderStatusCategory,
} from '@/app/api/lib/modules/work-order-status/schemas/work-order-status-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListWorkOrderStatusesResponse = Paginated<WorkOrderStatus>;

export type SaveWorkOrderStatusRequest = {
  name: string;
  code: string;
  category: WorkOrderStatusCategory;
  color: string;
  description?: string;
};

export type SaveWorkOrderStatusResponse = { data: WorkOrderStatus };
