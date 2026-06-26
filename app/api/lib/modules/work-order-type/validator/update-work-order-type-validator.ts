import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateWorkOrderTypeInput,
  updateWorkOrderTypeSchema,
  workOrderTypeIdSchema,
} from '../schemas/work-order-type-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { workOrderTypeRepository } from '../repository/work-order-type-repository';
import { validateWorkOrderTypeUniqueness } from './work-order-type-uniqueness-validator';

export type UpdateWorkOrderTypeParams = {
  id: number;
  payload: UpdateWorkOrderTypeInput;
};

export async function validateUpdateWorkOrderType(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateWorkOrderTypeParams>> {
  const idResult = workOrderTypeIdSchema.safeParse(id);
  const payloadResult = updateWorkOrderTypeSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Work order type ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingWorkOrderType = await workOrderTypeRepository.getWorkOrderTypeById(
    idResult.data,
    tenantId
  );

  if (!existingWorkOrderType) {
    return {
      success: false,
      errors: ['Work order type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateWorkOrderTypeUniqueness({
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
