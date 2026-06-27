import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { workOrderPriorityRepository } from '../repository/work-order-priority-repository';
import type { WorkOrderPriority } from '../schemas/work-order-priority-schema';
import { validateCreateWorkOrderPriority } from '../validator/create-work-order-priority-validator';
import { getWorkOrderPriorityUniqueConstraintErrors } from '../validator/work-order-priority-uniqueness-validator';

export async function createWorkOrderPriorityCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<WorkOrderPriority>> {
  const validationResult = await validateCreateWorkOrderPriority(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const workOrderPriorityData = { ...validationResult.data, tenantId };

  try {
    const createdWorkOrderPriority =
      await workOrderPriorityRepository.createWorkOrderPriority(workOrderPriorityData);
    return { success: true, data: createdWorkOrderPriority };
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
