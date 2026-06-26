import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { workOrderTypeRepository } from '../repository/work-order-type-repository';
import type { WorkOrderType } from '../schemas/work-order-type-schema';
import { getWorkOrderTypeUniqueConstraintErrors } from '../validator/work-order-type-uniqueness-validator';
import { validateCreateWorkOrderType } from '../validator/create-work-order-type-validator';

export async function createWorkOrderTypeCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<WorkOrderType>> {
  const validationResult = await validateCreateWorkOrderType(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const workOrderTypeData = { ...validationResult.data, tenantId };

  try {
    const createdWorkOrderType =
      await workOrderTypeRepository.createWorkOrderType(workOrderTypeData);
    return { success: true, data: createdWorkOrderType };
  } catch (error) {
    const constraintErrors = getWorkOrderTypeUniqueConstraintErrors(error, workOrderTypeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
