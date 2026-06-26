import type { WorkOrderType } from '@/app/api/lib/modules/work-order-type/schemas/work-order-type-schema';

export type GetWorkOrderTypeResponse = {
  data: WorkOrderType;
};

export type UpdateWorkOrderTypeRequest = {
  name: string;
  code: string;
  color: string;
  description?: string;
};

export type UpdateWorkOrderTypeResponse = {
  data: WorkOrderType;
};

export type DeleteWorkOrderTypeResponse = void;
