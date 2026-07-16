import type { WorkOrderStatusCategory } from '@/app/api/lib/modules/work-order-status/schemas/work-order-status-schema';
import { WORK_ORDER_STATUS_CATEGORIES } from '@/app/api/lib/modules/work-order-status/schemas/work-order-status-schema';

const WORK_ORDER_STATUS_CATEGORY_LABELS: Record<WorkOrderStatusCategory, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
};

export const WORK_ORDER_STATUS_CATEGORY_OPTIONS = WORK_ORDER_STATUS_CATEGORIES.map((category) => ({
  value: category,
  label: WORK_ORDER_STATUS_CATEGORY_LABELS[category],
}));

export function getWorkOrderStatusCategoryLabel(category: WorkOrderStatusCategory) {
  return WORK_ORDER_STATUS_CATEGORY_LABELS[category];
}
