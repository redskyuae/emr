import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { workOrderTypeRepository } from '../repository/work-order-type-repository';
import type { WorkOrderType } from '../schemas/work-order-type-schema';
import { validateGetWorkOrderTypeById } from '../validator/get-work-order-type-by-id-validator';

export async function getWorkOrderTypeByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<WorkOrderType>> {
  const validationResult = validateGetWorkOrderTypeById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const workOrderType = await workOrderTypeRepository.getWorkOrderTypeById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!workOrderType) {
    return {
      success: false,
      errors: ['Work order type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: workOrderType };
}
