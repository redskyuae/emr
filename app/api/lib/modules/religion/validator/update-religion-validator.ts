import type { ValidationResult } from '@/app/api/lib/utils/types';
import { type UpdateReligionInput, updateReligionSchema } from '../schemas/religion-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateUpdateReligion(payload: unknown): ValidationResult<UpdateReligionInput> {
  const result = updateReligionSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
