import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { createVisitTypeSchema, type CreateVisitTypeInput } from '../schemas/visit-type-schema';
import { validateVisitTypeUniqueness } from './visit-type-uniqueness-validator';

export async function validateCreateVisitType(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateVisitTypeInput>> {
  const result = createVisitTypeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateVisitTypeUniqueness({
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
