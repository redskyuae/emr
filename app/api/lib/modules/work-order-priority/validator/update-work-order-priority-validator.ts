import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { workOrderPriorityRepository } from '../repository/work-order-priority-repository';
import {
  type UpdateWorkOrderPriorityInput,
  updateWorkOrderPrioritySchema,
  workOrderPriorityIdSchema,
} from '../schemas/work-order-priority-schema';
import { validateWorkOrderPriorityUniqueness } from './work-order-priority-uniqueness-validator';

export type UpdateWorkOrderPriorityParams = {
  id: number;
  payload: UpdateWorkOrderPriorityInput;
};

export async function validateUpdateWorkOrderPriority(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateWorkOrderPriorityParams>> {
  const idResult = workOrderPriorityIdSchema.safeParse(id);
  const payloadResult = updateWorkOrderPrioritySchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Work order priority ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingWorkOrderPriority = await workOrderPriorityRepository.getWorkOrderPriorityById(
    idResult.data,
    tenantId
  );

  if (!existingWorkOrderPriority) {
    return {
      success: false,
      errors: ['Work order priority not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateWorkOrderPriorityUniqueness({
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

  return {
    success: true,
    data: {
      id: idResult.data,
      payload: payloadResult.data,
    },
  };
}
