import type { ValidationResult } from '@/app/api/lib/utils/types';
import {
  createNationalitySchema,
  type CreateNationalityInput,
} from '../schemas/nationality-schema';
import { formatValidationErrors } from './validation-errors';

export function validateCreateNationality(
  payload: unknown
): ValidationResult<CreateNationalityInput> {
  const result = createNationalitySchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
