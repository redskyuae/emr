import type { ValidationResult } from '@/app/api/lib/utils/types';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';
import { therapistListParamsSchema, type TherapistListParams } from '../schemas/therapist-schema';

export function validateGetTherapists(input: unknown): ValidationResult<TherapistListParams> {
  const result = therapistListParamsSchema.safeParse(input);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, errors: formatValidationErrors(result.error) };
}
