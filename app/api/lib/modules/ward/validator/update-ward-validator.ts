import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { wardRepository } from '../repository/ward-repository';
import { updateWardSchema, wardIdSchema, type UpdateWardInput } from '../schemas/ward-schema';
import { validateWardUniqueness } from './ward-uniqueness-validator';

export type UpdateWardParams = {
  id: number;
  payload: UpdateWardInput;
};

export async function validateUpdateWard(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateWardParams>> {
  const idResult = wardIdSchema.safeParse(id);
  const payloadResult = updateWardSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Ward ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingWard = await wardRepository.getWardById(idResult.data, tenantId);

  if (!existingWard) {
    return {
      success: false,
      errors: ['Ward not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateWardUniqueness({
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
