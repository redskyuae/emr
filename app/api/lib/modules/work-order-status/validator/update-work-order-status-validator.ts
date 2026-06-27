import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { workOrderStatusRepository } from '../repository/work-order-status-repository';
import { workOrderRepository } from '../../work-order/repository/work-order-repository';
import {
  workOrderStatusIdSchema,
  type UpdateWorkOrderStatusInput,
  updateWorkOrderStatusSchema,
} from '../schemas/work-order-status-schema';
import { validateSystemWorkOrderStatusUpdate } from './work-order-status-protection-validator';
import { validateWorkOrderStatusUniqueness } from './work-order-status-uniqueness-validator';

export type UpdateWorkOrderStatusParams = { id: number; payload: UpdateWorkOrderStatusInput };

export async function validateUpdateWorkOrderStatus(
  id: unknown,
  payload: unknown,
  tenantId: string,
  usage: Pick<typeof workOrderRepository, 'isStatusInUse'> = workOrderRepository
): Promise<ValidationResult<UpdateWorkOrderStatusParams>> {
  const idResult = workOrderStatusIdSchema.safeParse(id);
  const payloadResult = updateWorkOrderStatusSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Work order status ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingWorkOrderStatus = await workOrderStatusRepository.getWorkOrderStatusById(
    idResult.data,
    tenantId
  );

  if (!existingWorkOrderStatus) {
    return {
      success: false,
      errors: ['Work order status not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const protectionResult = validateSystemWorkOrderStatusUpdate(
    existingWorkOrderStatus,
    payloadResult.data
  );

  if (!protectionResult.success) {
    return protectionResult;
  }

  if (
    existingWorkOrderStatus.category !== payloadResult.data.category &&
    (await usage.isStatusInUse(idResult.data, tenantId))
  ) {
    return {
      success: false,
      errors: ['Work order status category cannot be changed while the status is in use.'],
      status: StatusCodes.CONFLICT,
    };
  }

  const uniquenessResult = await validateWorkOrderStatusUniqueness({
    ...payloadResult.data,
    tenantId,
    excludeId: idResult.data,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return { success: true, data: { id: idResult.data, payload: payloadResult.data } };
}
