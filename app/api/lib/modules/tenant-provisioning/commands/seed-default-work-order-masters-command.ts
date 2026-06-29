import type { CommandResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { tenantIdSchema } from '../../tenant/schemas/tenant-schema';
import { workOrderPriorityRepository } from '../../work-order-priority/repository/work-order-priority-repository';
import { workOrderStatusRepository } from '../../work-order-status/repository/work-order-status-repository';
import { workOrderTypeRepository } from '../../work-order-type/repository/work-order-type-repository';

const DEFAULT_WORK_ORDER_TYPES = [
  { code: 'PREV', name: 'Preventive', color: '#2563EB' },
  { code: 'CORR', name: 'Corrective', color: '#DC2626' },
  { code: 'CALIB', name: 'Calibration', color: '#7C3AED' },
  { code: 'INSP', name: 'Inspection', color: '#0EA5E9' },
] as const;

const DEFAULT_WORK_ORDER_PRIORITIES = [
  { code: 'LOW', name: 'Low', color: '#6B7280' },
  { code: 'MED', name: 'Medium', color: '#2563EB' },
  { code: 'HIGH', name: 'High', color: '#D97706' },
  { code: 'CRIT', name: 'Critical', color: '#DC2626' },
] as const;

const DEFAULT_WORK_ORDER_STATUSES = [
  { code: 'OPEN', name: 'Open', color: '#6B7280', category: 'OPEN', isSystem: true },
  {
    code: 'INPROG',
    name: 'In Progress',
    color: '#2563EB',
    category: 'IN_PROGRESS',
    isSystem: true,
  },
  {
    code: 'SCHED',
    name: 'Scheduled',
    color: '#D97706',
    category: 'SCHEDULED',
    isSystem: true,
  },
  {
    code: 'DONE',
    name: 'Completed',
    color: '#16A34A',
    category: 'COMPLETED',
    isSystem: true,
  },
  {
    code: 'OVERDUE',
    name: 'Overdue',
    color: '#DC2626',
    category: 'OVERDUE',
    isSystem: true,
  },
] as const;

type WorkOrderMasterSeeders = {
  seedTypes: typeof workOrderTypeRepository.seedDefaultWorkOrderTypes;
  seedStatuses: typeof workOrderStatusRepository.seedDefaultWorkOrderStatuses;
  seedPriorities: typeof workOrderPriorityRepository.seedDefaultWorkOrderPriorities;
};

const workOrderMasterSeeders: WorkOrderMasterSeeders = {
  seedTypes: workOrderTypeRepository.seedDefaultWorkOrderTypes,
  seedStatuses: workOrderStatusRepository.seedDefaultWorkOrderStatuses,
  seedPriorities: workOrderPriorityRepository.seedDefaultWorkOrderPriorities,
};

export async function seedDefaultWorkOrderMastersCommand(
  tenantId: unknown,
  seeders: WorkOrderMasterSeeders = workOrderMasterSeeders
): Promise<CommandResult<void>> {
  const tenantIdResult = tenantIdSchema.safeParse(tenantId);

  if (!tenantIdResult.success) {
    return { success: false, errors: formatValidationErrors(tenantIdResult.error) };
  }

  const seedResults = await Promise.allSettled([
    seeders.seedTypes(tenantIdResult.data, [
      ...DEFAULT_WORK_ORDER_TYPES.map((workOrderType) => ({
        ...workOrderType,
        description: undefined,
      })),
    ]),
    seeders.seedPriorities(tenantIdResult.data, [
      ...DEFAULT_WORK_ORDER_PRIORITIES.map((workOrderPriority) => ({
        ...workOrderPriority,
        description: undefined,
      })),
    ]),
    seeders.seedStatuses(tenantIdResult.data, [
      ...DEFAULT_WORK_ORDER_STATUSES.map((workOrderStatus) => ({
        ...workOrderStatus,
        description: undefined,
      })),
    ]),
  ]);

  if (seedResults.some((seedResult) => seedResult.status === 'rejected')) {
    return { success: false, errors: ['Failed to seed default work order masters.'] };
  }

  return { success: true, data: undefined };
}
