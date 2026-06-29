import type { WorkOrderSummary } from '@/app/api/lib/modules/work-order/schemas/work-order-schema';

export type GetWorkOrderSummaryResponse = {
  data: WorkOrderSummary;
};
