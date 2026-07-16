import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { allergenRepository } from '../repository/allergen-repository';
import type { Allergen } from '../schemas/allergen-schema';
import { getAllergenUniqueConstraintErrors } from '../validator/allergen-uniqueness-validator';
import { validateUpdateAllergen } from '../validator/update-allergen-validator';

export async function updateAllergenCommand(
  id: unknown,
  tenantId: string,
  payload: unknown
): Promise<CommandResult<Allergen>> {
  const validationResult = await validateUpdateAllergen(id, payload, tenantId);

  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.errors,
      status: validationResult.status,
    };
  }

  const validatedId = validationResult.data.id;
  const allergenData = { ...validationResult.data.payload, tenantId };

  try {
    const updatedAllergen = await allergenRepository.updateAllergen(validatedId, allergenData);

    if (!updatedAllergen) {
      return {
        success: false,
        errors: ['Allergen not found'],
        status: StatusCodes.NOT_FOUND,
      };
    }

    return { success: true, data: updatedAllergen };
  } catch (error) {
    const constraintErrors = getAllergenUniqueConstraintErrors(error, allergenData);

    if (constraintErrors.length > 0) {
      return { success: false, errors: constraintErrors, status: StatusCodes.CONFLICT };
    }

    throw error;
  }
}
