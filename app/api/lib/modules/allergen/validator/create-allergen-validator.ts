import type { ValidationResult } from '@/app/api/lib/utils/types';
import { createAllergenSchema, type CreateAllergenInput } from '../schemas/allergen-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { validateAllergenUniqueness } from './allergen-uniqueness-validator';

export async function validateCreateAllergen(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateAllergenInput>> {
  const result = createAllergenSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateAllergenUniqueness({
    ...result.data,
    tenantId,
  });

  if (!uniquenessResult.success) {
    return {
      success: false,
      errors: uniquenessResult.errors,
      status: uniquenessResult.status,
    };
  }

  return { success: true, data: result.data };
}
