import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { visitTypeRepository } from '../repository/visit-type-repository';
import {
  updateVisitTypeSchema,
  visitTypeIdSchema,
  type UpdateVisitTypeInput,
} from '../schemas/visit-type-schema';
import { validateVisitTypeUniqueness } from './visit-type-uniqueness-validator';

export type UpdateVisitTypeParams = {
  id: number;
  payload: UpdateVisitTypeInput;
};

export async function validateUpdateVisitType(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateVisitTypeParams>> {
  const idResult = visitTypeIdSchema.safeParse(id);
  const payloadResult = updateVisitTypeSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Visit type ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingVisitType = await visitTypeRepository.getVisitTypeById(idResult.data, tenantId);

  if (!existingVisitType) {
    return {
      success: false,
      errors: ['Visit type not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateVisitTypeUniqueness({
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
