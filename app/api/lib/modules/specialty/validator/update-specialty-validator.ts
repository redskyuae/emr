import { StatusCodes } from 'http-status-codes';

import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { specialtyRepository } from '../repository/specialty-repository';
import {
  specialtyIdSchema,
  type UpdateSpecialtyInput,
  updateSpecialtySchema,
} from '../schemas/specialty-schema';
import { validateSpecialtyUniqueness } from './specialty-uniqueness-validator';

export type UpdateSpecialtyParams = {
  id: number;
  payload: UpdateSpecialtyInput;
};

export async function validateUpdateSpecialty(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateSpecialtyParams>> {
  const idResult = specialtyIdSchema.safeParse(id);
  const payloadResult = updateSpecialtySchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Specialty ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingSpecialty = await specialtyRepository.getSpecialtyById(idResult.data, tenantId);

  if (!existingSpecialty) {
    return {
      success: false,
      errors: ['Specialty not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateSpecialtyUniqueness({
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
