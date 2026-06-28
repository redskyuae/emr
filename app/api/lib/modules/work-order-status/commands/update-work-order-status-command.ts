import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { workOrderStatusRepository } from '../repository/work-order-status-repository';
import type { WorkOrderStatus } from '../schemas/work-order-status-schema';
import { validateUpdateWorkOrderStatus } from '../validator/update-work-order-status-validator';
import { getWorkOrderStatusUniqueConstraintErrors } from '../validator/work-order-status-uniqueness-validator';

export async function updateWorkOrderStatusCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<WorkOrderStatus>> {
  const validationResult = await validateUpdateWorkOrderStatus(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const workOrderStatusData = { ...validationResult.data.payload, tenantId };

  try {
    const updateResult = await workOrderStatusRepository.updateWorkOrderStatus(
      validationResult.data.id,
      workOrderStatusData
    );

    if (updateResult.outcome === 'in-use') {
      return {
        success: false,
        errors: ['Work order status category cannot be changed while the status is in use.'],
        status: StatusCodes.CONFLICT,
      };
    }

    if (updateResult.outcome === 'not-found') {
      return {
        success: false,
        errors: ['Work order status not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updateResult.data };
  } catch (error) {
    const constraintErrors = getWorkOrderStatusUniqueConstraintErrors(error, workOrderStatusData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
