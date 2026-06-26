import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { workOrderPriorityRepository } from '../repository/work-order-priority-repository';
import type { WorkOrderPriority } from '../schemas/work-order-priority-schema';
import { validateGetWorkOrderPriorities } from '../validator/get-work-order-priorities-validator';

export type GetWorkOrderPrioritiesParams = {
  tenantId: unknown;
  page?: number;
  limit?: number;
  query?: string;
};

export async function getWorkOrderPrioritiesQuery({
  tenantId,
  page,
  limit,
  query,
}: GetWorkOrderPrioritiesParams): Promise<ListQueryResult<WorkOrderPriority>> {
  const tenantIdValidationResult = validateGetWorkOrderPriorities(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await workOrderPriorityRepository.getWorkOrderPriorities({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
