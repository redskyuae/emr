import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { workOrderPriorityRepository } from '../repository/work-order-priority-repository';
import type { WorkOrderPriority } from '../schemas/work-order-priority-schema';
import { validateGetWorkOrderPriorityById } from '../validator/get-work-order-priority-by-id-validator';

export async function getWorkOrderPriorityByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<WorkOrderPriority>> {
  const validationResult = validateGetWorkOrderPriorityById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const workOrderPriority = await workOrderPriorityRepository.getWorkOrderPriorityById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!workOrderPriority) {
    return {
      success: false,
      errors: ['Work order priority not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: workOrderPriority };
}
