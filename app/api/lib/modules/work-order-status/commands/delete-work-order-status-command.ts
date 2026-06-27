import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { workOrderStatusRepository } from '../repository/work-order-status-repository';
import type { WorkOrderStatus } from '../schemas/work-order-status-schema';
import { validateDeleteWorkOrderStatus } from '../validator/delete-work-order-status-validator';

export async function deleteWorkOrderStatusCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<WorkOrderStatus>> {
  const validationResult = await validateDeleteWorkOrderStatus(id, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const deletedWorkOrderStatus = await workOrderStatusRepository.softDeleteWorkOrderStatus(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedWorkOrderStatus) {
    return {
      success: false,
      errors: ['Work order status not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedWorkOrderStatus };
}
