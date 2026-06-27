import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { workOrderPriorityRepository } from '../repository/work-order-priority-repository';
import type { WorkOrderPriority } from '../schemas/work-order-priority-schema';
import { validateDeleteWorkOrderPriority } from '../validator/delete-work-order-priority-validator';

export async function deleteWorkOrderPriorityCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<WorkOrderPriority>> {
  const validationResult = await validateDeleteWorkOrderPriority(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deleteResult = await workOrderPriorityRepository.softDeleteWorkOrderPriority(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (deleteResult.outcome === 'in-use') {
    return {
      success: false,
      errors: ['Work order priority cannot be deleted while it is in use.'],
      status: StatusCodes.CONFLICT,
    };
  }

  if (deleteResult.outcome === 'not-found') {
    return {
      success: false,
      errors: ['Work order priority not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deleteResult.data };
}
