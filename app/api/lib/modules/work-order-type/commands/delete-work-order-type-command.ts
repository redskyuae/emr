import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { workOrderTypeRepository } from '../repository/work-order-type-repository';
import type { WorkOrderType } from '../schemas/work-order-type-schema';
import { validateDeleteWorkOrderType } from '../validator/delete-work-order-type-validator';

export async function deleteWorkOrderTypeCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<WorkOrderType>> {
  const validationResult = await validateDeleteWorkOrderType(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deleteResult = await workOrderTypeRepository.deleteWorkOrderType(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (deleteResult.outcome === 'in-use') {
    return {
      success: false,
      errors: ['Work order type cannot be deleted while it is in use.'],
      status: StatusCodes.CONFLICT,
    };
  }

  if (deleteResult.outcome === 'not-found') {
    return {
      success: false,
      errors: ['Work order type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deleteResult.data };
}
