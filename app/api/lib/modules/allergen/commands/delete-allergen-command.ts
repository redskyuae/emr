import { StatusCodes } from 'http-status-codes';
import type { CommandResult } from '@/app/api/lib/utils/types';
import { allergenRepository } from '../repository/allergen-repository';
import type { Allergen } from '../schemas/allergen-schema';
import { validateDeleteAllergen } from '../validator/delete-allergen-validator';

export async function deleteAllergenCommand(
  id: unknown,
  tenantId: unknown
): Promise<CommandResult<Allergen>> {
  const validationResult = validateDeleteAllergen(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const deletedAllergen = await allergenRepository.deleteAllergen(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!deletedAllergen) {
    return {
      success: false,
      errors: ['Allergen not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: deletedAllergen };
}
