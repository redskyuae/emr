import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { createWardSchema, type CreateWardInput } from '../schemas/ward-schema';
import { validateWardUniqueness } from './ward-uniqueness-validator';

export async function validateCreateWard(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateWardInput>> {
  const result = createWardSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateWardUniqueness({
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
