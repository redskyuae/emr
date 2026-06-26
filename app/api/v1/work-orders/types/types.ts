import type { WorkOrderType } from '@/app/api/lib/modules/work-order-type/schemas/work-order-type-schema';
import type { Paginated } from '@/app/api/lib/utils/types';

export type ListWorkOrderTypesResponse = Paginated<WorkOrderType>;

export type SaveWorkOrderTypeRequest = {
  name: string;
  code: string;
  color: string;
  description?: string;
};

export type SaveWorkOrderTypeResponse = {
  data: WorkOrderType;
};
