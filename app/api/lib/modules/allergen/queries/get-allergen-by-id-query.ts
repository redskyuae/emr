import { StatusCodes } from 'http-status-codes';
import type { SingleQueryResult } from '@/app/api/lib/utils/types';
import { allergenRepository } from '../repository/allergen-repository';
import type { Allergen } from '../schemas/allergen-schema';
import { validateGetAllergenById } from '../validator/get-allergen-by-id-validator';

export async function getAllergenByIdQuery(
  id: unknown,
  tenantId: unknown
): Promise<SingleQueryResult<Allergen>> {
  const validationResult = validateGetAllergenById(id, tenantId);

  if (!validationResult.success) {
    return { success: false, errors: validationResult.errors };
  }

  const allergen = await allergenRepository.getAllergenById(
    validationResult.data.id,
    validationResult.data.tenantId
  );

  if (!allergen) {
    return {
      success: false,
      errors: ['Allergen not found'],
      status: StatusCodes.NOT_FOUND,
    };
  }

  return { success: true, data: allergen };
}
