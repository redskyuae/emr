import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { workOrderPriorityRepository } from '../repository/work-order-priority-repository';
import type { WorkOrderPriority } from '../schemas/work-order-priority-schema';
import { validateUpdateWorkOrderPriority } from '../validator/update-work-order-priority-validator';
import { getWorkOrderPriorityUniqueConstraintErrors } from '../validator/work-order-priority-uniqueness-validator';

export async function updateWorkOrderPriorityCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<WorkOrderPriority>> {
  const validationResult = await validateUpdateWorkOrderPriority(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const workOrderPriorityData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedWorkOrderPriority = await workOrderPriorityRepository.updateWorkOrderPriority(
      validatedId,
      workOrderPriorityData
    );

    if (!updatedWorkOrderPriority) {
      return {
        success: false,
        errors: ['Work order priority not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedWorkOrderPriority };
  } catch (error) {
    const constraintErrors = getWorkOrderPriorityUniqueConstraintErrors(
      error,
      workOrderPriorityData
    );

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
