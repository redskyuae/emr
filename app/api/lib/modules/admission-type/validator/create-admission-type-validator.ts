import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import {
  createAdmissionTypeSchema,
  type CreateAdmissionTypeInput,
} from '../schemas/admission-type-schema';
import { validateAdmissionTypeUniqueness } from './admission-type-uniqueness-validator';

export async function validateCreateAdmissionType(
  payload: unknown,
  tenantId: string
): Promise<ValidationResult<CreateAdmissionTypeInput>> {
  const result = createAdmissionTypeSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  const uniquenessResult = await validateAdmissionTypeUniqueness({
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
