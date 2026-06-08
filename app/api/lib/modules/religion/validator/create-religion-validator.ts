import type { ValidationResult } from '@/app/api/lib/utils/types';
import { createReligionSchema, type CreateReligionInput } from '../schemas/religion-schema';
import { formatValidationErrors } from './validation-errors';

export function validateCreateReligion(payload: unknown): ValidationResult<CreateReligionInput> {
  const result = createReligionSchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
