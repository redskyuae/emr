import type { WorkOrderPriority } from '@/app/api/lib/modules/work-order-priority/schemas/work-order-priority-schema';

export type GetWorkOrderPriorityResponse = {
  data: WorkOrderPriority;
};

export type UpdateWorkOrderPriorityRequest = {
  name: string;
  code: string;
  color: string;
  description?: string;
};

export type UpdateWorkOrderPriorityResponse = {
  data: WorkOrderPriority;
};

export type DeleteWorkOrderPriorityResponse = void;
