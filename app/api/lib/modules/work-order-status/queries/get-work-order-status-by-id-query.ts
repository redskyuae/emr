import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { workOrderStatusRepository } from '../repository/work-order-status-repository';
import type { WorkOrderStatus } from '../schemas/work-order-status-schema';
import { validateGetWorkOrderStatusById } from '../validator/get-work-order-status-by-id-validator';

export async function getWorkOrderStatusByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<WorkOrderStatus>> {
  const validationResult = validateGetWorkOrderStatusById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const workOrderStatus = await workOrderStatusRepository.getWorkOrderStatusById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!workOrderStatus) {
    return {
      success: false,
      errors: ['Work order status not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: workOrderStatus };
}
