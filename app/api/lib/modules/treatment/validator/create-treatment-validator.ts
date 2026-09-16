import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { createTreatmentSchema, type CreateTreatmentInput } from '../schemas/treatment-schema';
import { validateTreatmentUniqueness } from './treatment-uniqueness-validator';

export async function validateCreateTreatment(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateTreatmentInput>> {
  const result = createTreatmentSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateTreatmentUniqueness({
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
