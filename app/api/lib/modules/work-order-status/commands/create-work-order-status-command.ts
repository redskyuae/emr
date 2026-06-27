import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { workOrderStatusRepository } from '../repository/work-order-status-repository';
import type { WorkOrderStatus } from '../schemas/work-order-status-schema';
import { validateCreateWorkOrderStatus } from '../validator/create-work-order-status-validator';
import { getWorkOrderStatusUniqueConstraintErrors } from '../validator/work-order-status-uniqueness-validator';

export async function createWorkOrderStatusCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<WorkOrderStatus>> {
  const validationResult = await validateCreateWorkOrderStatus(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const workOrderStatusData = { ...validationResult.data, tenantId };

  try {
    const createdWorkOrderStatus =
      await workOrderStatusRepository.createWorkOrderStatus(workOrderStatusData);
    return { success: true, data: createdWorkOrderStatus };
  } catch (error) {
    const constraintErrors = getWorkOrderStatusUniqueConstraintErrors(error, workOrderStatusData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
