import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { allergenRepository } from '../repository/allergen-repository';
import type { Allergen } from '../schemas/allergen-schema';
import { getAllergenUniqueConstraintErrors } from '../validator/allergen-uniqueness-validator';
import { validateCreateAllergen } from '../validator/create-allergen-validator';

export async function createAllergenCommand(
  payload: unknown,
  tenantId: string
): Promise<CommandResult<Allergen>> {
  const validationResult = await validateCreateAllergen(payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const allergenData = { ...validationResult.data, tenantId };

  try {
    const createdAllergen = await allergenRepository.createAllergen(allergenData);
    return { success: true, data: createdAllergen };
  } catch (error) {
    const constraintErrors = getAllergenUniqueConstraintErrors(error, allergenData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
