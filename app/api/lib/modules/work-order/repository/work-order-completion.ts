import type { WorkOrderStatusCategory } from '../../work-order-status/schemas/work-order-status-schema';

export function initialCompletedOn(category: WorkOrderStatusCategory, now: Date) {
  return category === 'COMPLETED' ? now : null;
}
