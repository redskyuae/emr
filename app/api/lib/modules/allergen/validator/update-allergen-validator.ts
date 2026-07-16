import { StatusCodes } from 'http-status-codes';
import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateAllergenInput,
  updateAllergenSchema,
  allergenIdSchema,
} from '../schemas/allergen-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { allergenRepository } from '../repository/allergen-repository';
import { validateAllergenUniqueness } from './allergen-uniqueness-validator';

export type UpdateAllergenParams = {
  id: number;
  payload: UpdateAllergenInput;
};

export async function validateUpdateAllergen(
  id: unknown,
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<UpdateAllergenParams>> {
  const idResult = allergenIdSchema.safeParse(id);
  const payloadResult = updateAllergenSchema.safeParse(payload);

  if (!idResult.success || !payloadResult.success) {
    const errors: string[] = [];

    if (!idResult.success) {
      errors.push(`Allergen ${String(id)} is Invalid.`);
    }

    if (!payloadResult.success) {
      errors.push(...formatValidationErrors(payloadResult.error));
    }

    return { success: false, errors };
  }

  const existingAllergen = await allergenRepository.getAllergenById(idResult.data, tenantId);

  if (!existingAllergen) {
    return {
      success: false,
      errors: ['Allergen not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  const uniquenessResult = await validateAllergenUniqueness({
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
