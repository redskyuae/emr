import type {
  WorkOrderStatus,
  WorkOrderStatusCategory,
} from '@/app/api/lib/modules/work-order-status/schemas/work-order-status-schema';

export type GetWorkOrderStatusResponse = { data: WorkOrderStatus };

export type UpdateWorkOrderStatusRequest = {
  name: string;
  code: string;
  category: WorkOrderStatusCategory;
  color: string;
  description?: string;
};

export type UpdateWorkOrderStatusResponse = { data: WorkOrderStatus };
export type DeleteWorkOrderStatusResponse = void;
