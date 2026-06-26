import type { WorkOrderPriority } from '@/app/api/lib/modules/work-order-priority/schemas/work-order-priority-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListWorkOrderPrioritiesResponse = Paginated<WorkOrderPriority>;

export type SaveWorkOrderPriorityRequest = {
  name: string;
  code: string;
  color: string;
  description?: string;
};

export type SaveWorkOrderPriorityResponse = {
  data: WorkOrderPriority;
};
