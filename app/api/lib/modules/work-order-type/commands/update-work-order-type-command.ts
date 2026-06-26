import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { workOrderTypeRepository } from '../repository/work-order-type-repository';
import type { WorkOrderType } from '../schemas/work-order-type-schema';
import { getWorkOrderTypeUniqueConstraintErrors } from '../validator/work-order-type-uniqueness-validator';
import { validateUpdateWorkOrderType } from '../validator/update-work-order-type-validator';

export async function updateWorkOrderTypeCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<WorkOrderType>> {
  const validationResult = await validateUpdateWorkOrderType(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const workOrderTypeData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedWorkOrderType = await workOrderTypeRepository.updateWorkOrderType(
      validatedId,
      workOrderTypeData
    );

    if (!updatedWorkOrderType) {
      return {
        success: false,
        errors: ['Work order type not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedWorkOrderType };
  } catch (error) {
    const constraintErrors = getWorkOrderTypeUniqueConstraintErrors(error, workOrderTypeData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
