import type { ListQueryResult } from '@/app/api/lib/utils/types';
import { allergenRepository } from '../repository/allergen-repository';
import type { Allergen } from '../schemas/allergen-schema';
import { validateGetAllergens } from '../validator/get-allergens-validator';

export type GetAllergensParams = {
  page?: number;
  query?: string;
  limit?: number;
  tenantId: unknown;
};

export async function getAllergensQuery({
  tenantId,
  page,
  limit,
  query,
}: GetAllergensParams): Promise<ListQueryResult<Allergen>> {
  const tenantIdValidationResult = validateGetAllergens(tenantId);

  if (!tenantIdValidationResult.success) {
    return { success: false, errors: tenantIdValidationResult.errors };
  }

  const { data, total } = await allergenRepository.getAllergens({
    tenantId: tenantIdValidationResult.data,
    page,
    limit,
    query,
  });

  return { success: true, data, total };
}
