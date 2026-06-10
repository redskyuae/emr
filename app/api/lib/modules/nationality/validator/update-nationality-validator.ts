import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  type UpdateNationalityInput,
  updateNationalitySchema,
} from '../schemas/nationality-schema';
import { formatValidationErrors } from '@/app/api/lib/utils/utils';

export function validateUpdateNationality(
  payload: unknown
): ValidationResult<UpdateNationalityInput> {
  const result = updateNationalitySchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
