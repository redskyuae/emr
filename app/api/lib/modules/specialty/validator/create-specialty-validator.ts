import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { createSpecialtySchema, type CreateSpecialtyInput } from '../schemas/specialty-schema';
import { validateSpecialtyUniqueness } from './specialty-uniqueness-validator';

export async function validateCreateSpecialty(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateSpecialtyInput>> {
  const result = createSpecialtySchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateSpecialtyUniqueness({
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
