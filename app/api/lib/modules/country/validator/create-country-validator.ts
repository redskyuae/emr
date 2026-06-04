import type { ValidationResult } from '@/app/api/lib/utils/types';
import { createCountrySchema, type CreateCountryInput } from '../schemas/country-schema';
import { formatValidationErrors } from './validation-errors';

export function validateCreateCountry(payload: unknown): ValidationResult<CreateCountryInput> {
  const result = createCountrySchema.safeParse(payload);

  if (!result.success) {
    return { success: false, errors: formatValidationErrors(result.error) };
  }

  return { success: true, data: result.data };
}
